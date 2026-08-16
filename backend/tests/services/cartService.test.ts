import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  addItemToCart,
  updateItemInCart,
  deleteItemInCart,
  clearCart,
  checkOut,
  getActiveCartForUser,
} from "../../src/services/cartService";
import productModel from "../../src/models/productModel";
import { cartModel } from "../../src/models/cartModel";
import { orderModel } from "../../src/models/orderModel";
import { AppError } from "../../src/utils/AppError";
import { makeProduct, makeUser } from "../factories";

const idOf = (doc: { _id: unknown }) => String(doc._id);

/** Asserts the thrown value is an AppError with the given code and status. */
const expectAppError = async (
  fn: () => Promise<unknown>,
  code: string,
  status: number
) => {
  await expect(fn()).rejects.toThrow(AppError);
  try {
    await fn();
  } catch (e) {
    const err = e as AppError;
    expect(err.code).toBe(code);
    expect(err.statusCode).toBe(status);
  }
};

describe("getActiveCartForUser", () => {
  it("creates a cart for a user who has none", async () => {
    const { user } = await makeUser();

    const cart = await getActiveCartForUser({ userId: idOf(user) });

    expect(cart).toBeTruthy();
    expect(cart.items).toHaveLength(0);
    expect(cart.totalAmount).toBe(0);
    expect(cart.status).toBe("active");
  });

  it("returns the existing cart instead of creating a second one", async () => {
    const { user } = await makeUser();

    const first = await getActiveCartForUser({ userId: idOf(user) });
    const second = await getActiveCartForUser({ userId: idOf(user) });

    expect(idOf(second)).toBe(idOf(first));
    expect(await cartModel.countDocuments({ userId: user._id })).toBe(1);
  });

  it("ignores completed carts and opens a fresh one", async () => {
    const { user } = await makeUser();
    const old = await getActiveCartForUser({ userId: idOf(user) });
    old.status = "completed";
    await old.save();

    const fresh = await getActiveCartForUser({ userId: idOf(user) });

    expect(idOf(fresh)).not.toBe(idOf(old));
    expect(fresh.status).toBe("active");
  });
});

describe("addItemToCart", () => {
  it("adds a product and sets the total", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ price: 250, stock: 4 });

    const cart = await addItemToCart({
      productId: idOf(product),
      quantity: 2,
      userId: idOf(user),
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.totalAmount).toBe(500);
  });

  it("snapshots the price at the time it was added", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 5 });

    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(user),
    });
    await productModel.findByIdAndUpdate(product._id, { price: 999 });

    const cart = await cartModel.findOne({ userId: user._id });
    expect(cart!.items[0].unitPrice).toBe(100);
    expect(cart!.totalAmount).toBe(100);
  });

  // The headline fix in §1.2: this used to return 400 "Item already exists".
  it("increments the quantity when the product is already in the cart", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 10 });

    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(user),
    });
    const cart = await addItemToCart({
      productId: idOf(product),
      quantity: 2,
      userId: idOf(user),
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.totalAmount).toBe(300);
  });

  it("rejects a quantity above stock", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 3 });

    await expectAppError(
      () =>
        addItemToCart({
          productId: idOf(product),
          quantity: 4,
          userId: idOf(user),
        }),
      "InsufficientStock",
      409
    );
  });

  it("counts what is already in the cart when checking stock", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 3 });

    await addItemToCart({
      productId: idOf(product),
      quantity: 2,
      userId: idOf(user),
    });

    // 2 + 2 exceeds the 3 in stock even though 2 alone would fit.
    await expectAppError(
      () =>
        addItemToCart({
          productId: idOf(product),
          quantity: 2,
          userId: idOf(user),
        }),
      "InsufficientStock",
      409
    );
  });

  it("rejects a product that does not exist", async () => {
    const { user } = await makeUser();

    await expectAppError(
      () =>
        addItemToCart({
          productId: String(new mongoose.Types.ObjectId()),
          quantity: 1,
          userId: idOf(user),
        }),
      "ProductNotFound",
      404
    );
  });

  it("rejects a retired product", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ isActive: false });

    await expectAppError(
      () =>
        addItemToCart({
          productId: idOf(product),
          quantity: 1,
          userId: idOf(user),
        }),
      "ProductNotFound",
      404
    );
  });
});

describe("updateItemInCart", () => {
  it("sets the quantity and recomputes the total", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ price: 50, stock: 10 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(user),
    });

    const cart = await updateItemInCart({
      productId: idOf(product),
      quantity: 4,
      userId: idOf(user),
    });

    expect(cart.items[0].quantity).toBe(4);
    expect(cart.totalAmount).toBe(200);
  });

  it("leaves other lines untouched", async () => {
    const { user } = await makeUser();
    const a = await makeProduct({ price: 100, stock: 10 });
    const b = await makeProduct({ price: 200, stock: 10 });
    await addItemToCart({
      productId: idOf(a),
      quantity: 1,
      userId: idOf(user),
    });
    await addItemToCart({
      productId: idOf(b),
      quantity: 1,
      userId: idOf(user),
    });

    const cart = await updateItemInCart({
      productId: idOf(a),
      quantity: 3,
      userId: idOf(user),
    });

    expect(cart.totalAmount).toBe(500); // 3×100 + 1×200
  });

  it("rejects an item that is not in the cart", async () => {
    const { user } = await makeUser();
    const product = await makeProduct();

    await expectAppError(
      () =>
        updateItemInCart({
          productId: idOf(product),
          quantity: 1,
          userId: idOf(user),
        }),
      "ItemNotInCart",
      404
    );
  });

  it("rejects a quantity above stock", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 2 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(user),
    });

    await expectAppError(
      () =>
        updateItemInCart({
          productId: idOf(product),
          quantity: 5,
          userId: idOf(user),
        }),
      "InsufficientStock",
      409
    );
  });
});

describe("deleteItemInCart", () => {
  it("removes the line and recomputes the total", async () => {
    const { user } = await makeUser();
    const a = await makeProduct({ price: 100, stock: 5 });
    const b = await makeProduct({ price: 30, stock: 5 });
    await addItemToCart({
      productId: idOf(a),
      quantity: 1,
      userId: idOf(user),
    });
    await addItemToCart({
      productId: idOf(b),
      quantity: 2,
      userId: idOf(user),
    });

    const cart = await deleteItemInCart({
      productId: idOf(a),
      userId: idOf(user),
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.totalAmount).toBe(60);
  });

  it("rejects an item that is not in the cart", async () => {
    const { user } = await makeUser();
    const product = await makeProduct();

    await expectAppError(
      () => deleteItemInCart({ productId: idOf(product), userId: idOf(user) }),
      "ItemNotInCart",
      404
    );
  });
});

describe("clearCart", () => {
  it("empties the cart and zeroes the total", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 5 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 2,
      userId: idOf(user),
    });

    const cart = await clearCart({ userId: idOf(user) });

    expect(cart.items).toHaveLength(0);
    expect(cart.totalAmount).toBe(0);
  });

  it("does not restore stock — nothing was ever reserved", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 5 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 2,
      userId: idOf(user),
    });

    await clearCart({ userId: idOf(user) });

    const fresh = await productModel.findById(product._id);
    expect(fresh!.stock).toBe(5);
  });
});

describe("checkOut", () => {
  const place = (userId: string) =>
    checkOut({
      userId,
      address: "1 Test Street",
      fullName: "Test User",
      payment: { last4: "4242", brand: "visa" },
    });

  it("creates an order and completes the cart", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 5 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 2,
      userId: idOf(user),
    });

    const order: any = await place(idOf(user));

    expect(order.total).toBe(200);
    expect(order.orderItems).toHaveLength(1);
    const cart = await cartModel.findOne({ userId: user._id });
    expect(cart!.status).toBe("completed");
  });

  it("decrements stock", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 5 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 3,
      userId: idOf(user),
    });

    await place(idOf(user));

    const fresh = await productModel.findById(product._id);
    expect(fresh!.stock).toBe(2);
  });

  it("copies product details onto the order so history survives a rename", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ title: "Original Name", stock: 5 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(user),
    });

    const order: any = await place(idOf(user));
    await productModel.findByIdAndUpdate(product._id, { title: "Renamed" });

    const stored = await orderModel.findById(order._id).lean();
    expect(stored!.orderItems[0].productTitle).toBe("Original Name");
  });

  it("stores only the masked card, never a PAN or CVC", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 5 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(user),
    });

    const order: any = await place(idOf(user));
    const raw = await orderModel.findById(order._id).lean();

    expect(raw!.payment.last4).toBe("4242");
    expect(raw).not.toHaveProperty("cardNumber");
    expect(raw).not.toHaveProperty("cvc");
    expect(raw).not.toHaveProperty("exp");
  });

  it("rejects an empty cart", async () => {
    const { user } = await makeUser();

    await expectAppError(() => place(idOf(user)), "EmptyCart", 400);
  });

  it("rejects when stock ran out after the item was added", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 5 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 3,
      userId: idOf(user),
    });

    // Someone else bought the stock in the meantime.
    await productModel.findByIdAndUpdate(product._id, { stock: 1 });

    await expectAppError(() => place(idOf(user)), "InsufficientStock", 409);
  });

  it("leaves stock untouched when checkout fails", async () => {
    const { user } = await makeUser();
    const ok = await makeProduct({ stock: 5 });
    const short = await makeProduct({ stock: 5 });
    await addItemToCart({
      productId: idOf(ok),
      quantity: 1,
      userId: idOf(user),
    });
    await addItemToCart({
      productId: idOf(short),
      quantity: 3,
      userId: idOf(user),
    });
    await productModel.findByIdAndUpdate(short._id, { stock: 0 });

    await expect(place(idOf(user))).rejects.toThrow(AppError);

    // The first line was decremented before the second failed; both must be
    // rolled back, either by the transaction or by compensating writes.
    const fresh = await productModel.findById(ok._id);
    expect(fresh!.stock).toBe(5);
    expect(await orderModel.countDocuments()).toBe(0);
  });

  it("does not complete the cart when checkout fails", async () => {
    const { user } = await makeUser();
    const product = await makeProduct({ stock: 1 });
    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(user),
    });
    await productModel.findByIdAndUpdate(product._id, { stock: 0 });

    await expect(place(idOf(user))).rejects.toThrow(AppError);

    const cart = await cartModel.findOne({ userId: user._id });
    expect(cart!.status).toBe("active");
  });

  /**
   * The reason checkout uses a conditional update rather than read-then-write.
   * With a plain `if (stock >= qty)` followed by a save, both of these would
   * pass the check and stock would go negative.
   */
  it("lets exactly one of two simultaneous checkouts win the last unit", async () => {
    const product = await makeProduct({ stock: 1, price: 100 });
    const { user: a } = await makeUser();
    const { user: b } = await makeUser();

    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(a),
    });
    await addItemToCart({
      productId: idOf(product),
      quantity: 1,
      userId: idOf(b),
    });

    const results = await Promise.allSettled([place(idOf(a)), place(idOf(b))]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(await orderModel.countDocuments()).toBe(1);

    const fresh = await productModel.findById(product._id);
    expect(fresh!.stock).toBe(0);
    expect(fresh!.stock).toBeGreaterThanOrEqual(0);
  });

  it("never oversells under heavier contention", async () => {
    const product = await makeProduct({ stock: 3, price: 10 });
    const users = await Promise.all(
      Array.from({ length: 8 }, () => makeUser())
    );

    await Promise.all(
      users.map(({ user }) =>
        addItemToCart({
          productId: idOf(product),
          quantity: 1,
          userId: idOf(user),
        })
      )
    );

    const results = await Promise.allSettled(
      users.map(({ user }) => place(idOf(user)))
    );

    const won = results.filter((r) => r.status === "fulfilled").length;
    expect(won).toBe(3);
    expect(await orderModel.countDocuments()).toBe(3);
    expect((await productModel.findById(product._id))!.stock).toBe(0);
  });
});
