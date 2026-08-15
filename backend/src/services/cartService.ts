import mongoose, { ClientSession } from "mongoose";
import { cartModel, IcartItem } from "../models/cartModel";
import productModel from "../models/productModel";
import { IorderItem, orderModel } from "../models/orderModel";

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
 * (Atlas, or any replica set) gets full atomicity.
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
  const cart = await cartModel.create({ userId, totalAmount: 0 });
  await cart.save();
  return cart;
};

interface GetActiveCartForUser {
  userId: string;
  populateProduct?: boolean;
}

// this function checks if the user has an active cart or not
// if the user have an active cart it returns it if not it creates one using the
// createCartForUser function and retursn it all depends on the user id

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

// Define an interface to structure the function's parameters
interface AddItemToCart {
  productId: any; // ID of the product being added
  quantity: number; // Quantity of the product being added
  userId: string; // ID of the user adding the item
}

// Function to add an item to the user's shopping cart
export const addItemToCart = async ({
  productId,
  quantity,
  userId,
}: AddItemToCart) => {
  // Retrieve the active cart for the user
  const cart = await getActiveCartForUser({ userId });

  // Check if the product is already in the cart
  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  // If the product is already in the cart, return an error
  if (existInCart) {
    return { data: "Item already exists in cart", statusCode: 400 };
  }

  // Fetch the product from the database using its ID
  const product = await productModel.findById(productId);

  // If the product doesn't exist in the database, return an error
  if (!product) {
    return { data: "Product not found", statusCode: 400 };
  }

  // Check if there is enough stock to fulfill the requested quantity
  if (product.stock < quantity) {
    return { data: "Low stock", statusCode: 400 };
  }

  // Add the product to the cart if all checks pass
  cart.items.push({ product: productId, unitPrice: product.price, quantity });

  // Update the total cart amount by adding the price of the new product
  cart.totalAmount += product.price * quantity;

  // Save the updated cart back to the database
  await cart.save();

  // Return the updated cart data with a success status
  return {
    data: await getActiveCartForUser({ userId, populateProduct: true }),
    statusCode: 200,
  };
};

interface UpdateItemInCart {
  productId: any; // ID of the product being added
  quantity: number; // Quantity of the product being added
  userId: string; // ID of the user adding the item
}

export const updateItemInCart = async ({
  productId,
  quantity,
  userId,
}: UpdateItemInCart) => {
  const cart = await getActiveCartForUser({ userId });

  // Check if the product is already in the cart
  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  if (!existInCart) {
    return { data: "Item is not in cart", statusCode: 400 };
  }

  const product = await productModel.findById(productId);

  // If the product doesn't exist in the database, return an error
  if (!product) {
    return { data: "Product not found", statusCode: 400 };
  }

  // Check if there is enough stock to fulfill the requested quantity
  if (product.stock < quantity) {
    return { data: "Low stock", statusCode: 400 };
  }

  // calculate the total amount of the items that are already in the cart

  const otherItemsInCart = cart.items.filter(
    (p) => p.product.toString() !== productId
  );

  let total = calculateCartTotalItems({ cartItems: otherItemsInCart });

  // add the new updated product to the total
  existInCart.quantity = quantity;

  total += existInCart.quantity * existInCart.unitPrice;
  cart.totalAmount = total;
  await cart.save();

  return {
    data: await getActiveCartForUser({ userId, populateProduct: true }),
    statusCode: 200,
  };
};

interface DeleteItemInCart {
  productId: any; // ID of the product being added
  userId: string; // ID of the user adding the item
}
export const deleteItemInCart = async ({
  userId,
  productId,
}: DeleteItemInCart) => {
  const cart = await getActiveCartForUser({ userId });

  // Check if the product is already in the cart
  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  if (!existInCart) {
    return { data: "Item is not in cart", statusCode: 400 };
  }

  const otherItemsInCart = cart.items.filter(
    (p) => p.product.toString() !== productId
  );
  const total = calculateCartTotalItems({ cartItems: otherItemsInCart });

  cart.items = otherItemsInCart;
  cart.totalAmount = total;
  await cart.save();

  return {
    data: await getActiveCartForUser({ userId, populateProduct: true }),
    statusCode: 200,
  };
};

const calculateCartTotalItems = ({ cartItems }: { cartItems: IcartItem[] }) => {
  const total = cartItems.reduce((sum, product) => {
    sum += product.quantity * product.unitPrice;
    return sum;
  }, 0);

  return total;
};

interface ClearCart {
  userId: string;
}

export const clearCart = async ({ userId }: ClearCart) => {
  const cart = await getActiveCartForUser({ userId });
  cart.items = [];
  cart.totalAmount = 0;

  await cart.save();

  return {
    data: await getActiveCartForUser({ userId, populateProduct: true }),
    statusCode: 200,
  };
};

interface CheckOut {
  userId: string;
  address: string;
  fullName: string;
  payment?: { last4?: string; brand?: string };
}

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
 * Returns the built line items, or the id of the product that ran out.
 */
const reserveStockAndBuildItems = async (
  items: IcartItem[],
  session?: ClientSession
): Promise<
  | { ok: true; orderItems: IorderItem[]; reserved: ReservedLine[] }
  | { ok: false; reason: string; reserved: ReservedLine[] }
> => {
  const orderItems: IorderItem[] = [];
  const reserved: ReservedLine[] = [];

  for (const item of items) {
    const updated = await productModel.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true, ...(session ? { session } : {}) }
    );

    if (!updated) {
      // Either the product was deleted, or another order took the last units
      // between adding to the cart and checking out.
      const stillExists = await productModel
        .findById(item.product)
        .session(session ?? null);

      return {
        ok: false,
        reserved,
        reason: stillExists
          ? `Not enough stock for "${stillExists.title}" (${stillExists.stock} left, ${item.quantity} requested)`
          : "A product in your cart is no longer available",
      };
    }

    reserved.push({ productId: item.product, quantity: item.quantity });

    orderItems.push({
      productTtile: updated.title,
      productImage: updated.image,
      unitprice: item.unitPrice,
      quantity: item.quantity,
    });
  }

  return { ok: true, orderItems, reserved };
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

export const checkOut = async ({
  userId,
  address,
  fullName,
  payment,
}: CheckOut) => {
  const cart = await getActiveCartForUser({ userId });

  // An empty cart previously produced a valid $0 order with no line items.
  if (cart.items.length === 0) {
    return { data: "Your cart is empty", statusCode: 400 };
  }

  const paymentRecord = {
    method: "mock" as const,
    // A real gateway sets this from a webhook. The mock provider settles
    // immediately, which keeps the field honest about what it represents.
    status: "paid" as const,
    last4: payment?.last4,
    brand: payment?.brand,
  };

  const buildOrder = (orderItems: IorderItem[]) => ({
    orderItems,
    total: cart.totalAmount,
    address,
    fullName,
    payment: paymentRecord,
    userId,
  });

  // ── Preferred path: one transaction covering every write ────────────────
  if (await transactionsSupported()) {
    const session = await mongoose.startSession();
    try {
      let result: { data: any; statusCode: number } | undefined;

      await session.withTransaction(async () => {
        const reservation = await reserveStockAndBuildItems(
          cart.items,
          session
        );

        if (!reservation.ok) {
          result = { data: reservation.reason, statusCode: 409 };
          // Aborting rolls back every decrement made inside this transaction.
          await session.abortTransaction();
          return;
        }

        const [order] = await orderModel.create(
          [buildOrder(reservation.orderItems)],
          { session }
        );

        cart.status = "completed";
        await cart.save({ session });

        result = { data: order, statusCode: 200 };
      });

      return result ?? { data: "Checkout failed", statusCode: 500 };
    } finally {
      await session.endSession();
    }
  }

  // ── Fallback: standalone mongod has no transactions ─────────────────────
  // Each stock decrement is still atomic on its own, so overselling remains
  // impossible. What we lose is all-or-nothing across documents, so we undo
  // the reservations by hand if a later write fails.
  const reservation = await reserveStockAndBuildItems(cart.items);

  if (!reservation.ok) {
    await releaseStock(reservation.reserved);
    return { data: reservation.reason, statusCode: 409 };
  }

  try {
    const order = await orderModel.create(buildOrder(reservation.orderItems));

    cart.status = "completed";
    await cart.save();

    return { data: order, statusCode: 200 };
  } catch (err) {
    await releaseStock(reservation.reserved);
    throw err;
  }
};
