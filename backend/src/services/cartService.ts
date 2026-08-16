import mongoose, { ClientSession } from "mongoose";
import { cartModel, IcartItem } from "../models/cartModel";
import productModel from "../models/productModel";
import { IorderItem, orderModel } from "../models/orderModel";
import { BadRequest, Conflict, NotFound } from "../utils/AppError";

/** A stock decrement that has been applied and may need undoing. */
interface ReservedLine {
  productId: unknown;
  quantity: number;
}

let transactionSupport: boolean | null = null;

/**
 * Multi-document transactions require a replica set or a sharded cluster; a
 * standalone mongod rejects them. Probed once and cached, so a developer
 * running a plain local mongod still gets a working checkout while production
 * (Atlas, or the replica set in docker-compose) gets full atomicity.
 */
const transactionsSupported = async (): Promise<boolean> => {
  if (transactionSupport !== null) return transactionSupport;

  try {
    const admin = mongoose.connection.db?.admin();
    const info = await admin?.command({ hello: 1 });
    // `setName` => replica set member, `msg: "isdbgrid"` => mongos.
    transactionSupport = Boolean(info?.setName || info?.msg === "isdbgrid");
  } catch {
    transactionSupport = false;
  }

  if (!transactionSupport) {
    console.warn(
      "[cart] MongoDB deployment does not support transactions " +
        "(standalone server). Checkout will use compensating writes instead. " +
        "Use a replica set or MongoDB Atlas for full atomicity."
    );
  }

  return transactionSupport;
};

interface CreateCartForUser {
  userId: string;
}

// this function is used to create a cart for the user in thier first sign up
const createCartForUser = async ({ userId }: CreateCartForUser) => {
  return cartModel.create({ userId, totalAmount: 0 });
};

interface GetActiveCartForUser {
  userId: string;
  populateProduct?: boolean;
}

/**
 * Returns the user's active cart, creating one if they have none, so no caller
 * has to handle the "user has no cart yet" case.
 */
export const getActiveCartForUser = async ({
  userId,
  populateProduct,
}: GetActiveCartForUser) => {
  let cart;

  if (populateProduct) {
    cart = await cartModel
      .findOne({ userId, status: "active" })
      .populate("items.product");
  } else {
    cart = await cartModel.findOne({ userId, status: "active" });
  }

  if (!cart) {
    cart = await createCartForUser({ userId });
  }
  return cart;
};

/** Reloads the cart with products populated — the shape every route returns. */
const populatedCart = (userId: string) =>
  getActiveCartForUser({ userId, populateProduct: true });

const calculateCartTotalItems = ({ cartItems }: { cartItems: IcartItem[] }) =>
  cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

interface AddItemToCart {
  productId: string;
  quantity: number;
  userId: string;
}

/**
 * Adds a product to the cart, or increases the quantity if it is already there.
 *
 * Previously a duplicate add was rejected with "Item already exists in cart",
 * which meant clicking Add to Cart twice produced an error rather than two
 * items — the most visible flaw in the shop.
 */
export const addItemToCart = async ({
  productId,
  quantity,
  userId,
}: AddItemToCart) => {
  const cart = await getActiveCartForUser({ userId });

  const product = await productModel.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw NotFound("Product not found", "ProductNotFound");
  }

  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  const currentQuantity = existInCart?.quantity ?? 0;
  const requestedTotal = currentQuantity + quantity;

  if (product.stock < requestedTotal) {
    throw Conflict(
      currentQuantity > 0
        ? `Only ${product.stock} in stock and you already have ${currentQuantity} in your cart`
        : `Only ${product.stock} left in stock`,
      "InsufficientStock"
    );
  }

  if (existInCart) {
    existInCart.quantity = requestedTotal;
  } else {
    cart.items.push({
      product: productId as unknown as IcartItem["product"],
      unitPrice: product.price,
      quantity,
    });
  }

  cart.totalAmount = calculateCartTotalItems({ cartItems: cart.items });
  await cart.save();

  return populatedCart(userId);
};

interface UpdateItemInCart {
  productId: string;
  quantity: number;
  userId: string;
}

export const updateItemInCart = async ({
  productId,
  quantity,
  userId,
}: UpdateItemInCart) => {
  const cart = await getActiveCartForUser({ userId });

  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  if (!existInCart) {
    throw NotFound("That item is not in your cart", "ItemNotInCart");
  }

  const product = await productModel.findById(productId);

  if (!product) {
    throw NotFound("Product not found", "ProductNotFound");
  }

  if (product.stock < quantity) {
    throw Conflict(`Only ${product.stock} left in stock`, "InsufficientStock");
  }

  existInCart.quantity = quantity;
  cart.totalAmount = calculateCartTotalItems({ cartItems: cart.items });
  await cart.save();

  return populatedCart(userId);
};

interface DeleteItemInCart {
  productId: string;
  userId: string;
}

export const deleteItemInCart = async ({
  userId,
  productId,
}: DeleteItemInCart) => {
  const cart = await getActiveCartForUser({ userId });

  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  if (!existInCart) {
    throw NotFound("That item is not in your cart", "ItemNotInCart");
  }

  cart.items = cart.items.filter((p) => p.product.toString() !== productId);
  cart.totalAmount = calculateCartTotalItems({ cartItems: cart.items });
  await cart.save();

  return populatedCart(userId);
};

interface ClearCart {
  userId: string;
}

export const clearCart = async ({ userId }: ClearCart) => {
  const cart = await getActiveCartForUser({ userId });
  cart.items = [];
  cart.totalAmount = 0;
  await cart.save();

  return populatedCart(userId);
};

/**
 * Reserves stock for every cart line and builds the order line items.
 *
 * The decrement is a single conditional update per product:
 *
 *   findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })
 *
 * MongoDB applies the filter and the update atomically, so two concurrent
 * checkouts for the last unit cannot both succeed — the loser's filter no
 * longer matches and it gets back null. Checking `stock` and then writing it
 * as two separate operations would let both pass the check.
 *
 * Applied reservations are pushed onto `reserved` so the non-transactional
 * path can undo them if a later step fails.
 */
const reserveStockAndBuildItems = async (
  items: IcartItem[],
  reserved: ReservedLine[],
  session?: ClientSession
): Promise<IorderItem[]> => {
  const orderItems: IorderItem[] = [];

  for (const item of items) {
    const updated = await productModel.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true, ...(session ? { session } : {}) }
    );

    if (!updated) {
      // Either the product was retired, or another order took the last units
      // between adding to the cart and checking out.
      const stillExists = await productModel
        .findById(item.product)
        .session(session ?? null);

      throw Conflict(
        stillExists
          ? `Not enough stock for "${stillExists.title}" (${stillExists.stock} left, ${item.quantity} requested)`
          : "A product in your cart is no longer available",
        "InsufficientStock"
      );
    }

    reserved.push({ productId: item.product, quantity: item.quantity });

    orderItems.push({
      productTitle: updated.title,
      productImage: updated.image,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    });
  }

  return orderItems;
};

/** Gives back stock that was reserved before a later step failed. */
const releaseStock = async (reserved: ReservedLine[]) => {
  for (const line of reserved) {
    await productModel.updateOne(
      { _id: line.productId },
      { $inc: { stock: line.quantity } }
    );
  }
};

interface CheckOut {
  userId: string;
  address: string;
  fullName: string;
  payment?: { last4?: string; brand?: string };
}

export const checkOut = async ({
  userId,
  address,
  fullName,
  payment,
}: CheckOut) => {
  const cart = await getActiveCartForUser({ userId });

  // An empty cart previously produced a valid $0 order with no line items.
  if (cart.items.length === 0) {
    throw BadRequest("Your cart is empty", "EmptyCart");
  }

  const buildOrder = (orderItems: IorderItem[]) => ({
    orderItems,
    total: cart.totalAmount,
    address,
    fullName,
    payment: {
      method: "mock" as const,
      // A real gateway sets this from a webhook. The mock provider settles
      // immediately, which keeps the field honest about what it represents.
      status: "paid" as const,
      last4: payment?.last4,
      brand: payment?.brand,
    },
    userId,
  });

  // ── Preferred path: one transaction covering every write ────────────────
  if (await transactionsSupported()) {
    const session = await mongoose.startSession();
    try {
      let order;

      // A throw inside the callback aborts the transaction, rolling back every
      // decrement, then propagates to the error handler.
      await session.withTransaction(async () => {
        const orderItems = await reserveStockAndBuildItems(
          cart.items,
          [],
          session
        );

        const [created] = await orderModel.create([buildOrder(orderItems)], {
          session,
        });

        cart.status = "completed";
        await cart.save({ session });

        order = created;
      });

      return order;
    } finally {
      await session.endSession();
    }
  }

  // ── Fallback: standalone mongod has no transactions ─────────────────────
  // Each stock decrement is still atomic on its own, so overselling remains
  // impossible. What we lose is all-or-nothing across documents, so the
  // reservations are undone by hand if a later write fails.
  const reserved: ReservedLine[] = [];

  try {
    const orderItems = await reserveStockAndBuildItems(cart.items, reserved);
    const order = await orderModel.create(buildOrder(orderItems));

    cart.status = "completed";
    await cart.save();

    return order;
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }
};
