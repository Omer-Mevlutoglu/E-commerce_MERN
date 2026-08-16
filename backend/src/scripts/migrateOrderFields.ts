/**
 * One-off migration:  npm run migrate:orders
 *
 * Renames the misspelled order-item fields that were baked into the schema,
 * and therefore into every stored document and every API response:
 *
 *   orderItems[].productTtile -> productTitle
 *   orderItems[].unitprice    -> unitPrice
 *
 * Also strips the card fields removed in Stage 1.0. Removing them from the
 * schema stopped new writes, but documents written before that still hold them.
 *
 * Safe to run repeatedly: $rename and $unset on absent fields are no-ops, and
 * documents are only matched if they still carry the old shape.
 */
import mongoose from "mongoose";
import { env } from "../config/env";

(async () => {
  await mongoose.connect(env.DATABASE_URL);
  const orders = mongoose.connection.collection("orders");

  const total = await orders.countDocuments();
  console.log(`[migrate] ${total} order(s) in ${env.DATABASE_URL}`);

  // ── 1. Rename the misspelled line-item fields ─────────────────────────
  const needsRename = await orders.countDocuments({
    "orderItems.productTtile": { $exists: true },
  });

  if (needsRename > 0) {
    const result = await orders.updateMany(
      { "orderItems.productTtile": { $exists: true } },
      [
        {
          $set: {
            orderItems: {
              $map: {
                input: "$orderItems",
                as: "item",
                in: {
                  productTitle: {
                    $ifNull: ["$$item.productTitle", "$$item.productTtile"],
                  },
                  productImage: "$$item.productImage",
                  unitPrice: {
                    $ifNull: ["$$item.unitPrice", "$$item.unitprice"],
                  },
                  quantity: "$$item.quantity",
                },
              },
            },
          },
        },
      ]
    );
    console.log(
      `[migrate] renamed line-item fields on ${result.modifiedCount} order(s)`
    );
  } else {
    console.log("[migrate] no orders need the field rename");
  }

  // ── 2. Strip card data left over from before Stage 1.0 ────────────────
  const withCard = await orders.countDocuments({
    $or: [
      { cardNumber: { $exists: true } },
      { cvc: { $exists: true } },
      { exp: { $exists: true } },
    ],
  });

  if (withCard > 0) {
    const result = await orders.updateMany(
      {},
      { $unset: { cardNumber: "", cvc: "", exp: "" } }
    );
    console.log(
      `[migrate] stripped card fields from ${result.modifiedCount} order(s)`
    );
  } else {
    console.log("[migrate] no orders hold card data");
  }

  // ── 3. Backfill a payment record where one is missing ─────────────────
  const noPayment = await orders.updateMany(
    { payment: { $exists: false } },
    { $set: { payment: { method: "mock", status: "paid" } } }
  );
  if (noPayment.modifiedCount > 0) {
    console.log(
      `[migrate] backfilled payment on ${noPayment.modifiedCount} order(s)`
    );
  }

  // ── 4. Give existing orders a fulfilment status ───────────────────────
  const noStatus = await orders.updateMany(
    { status: { $exists: false } },
    { $set: { status: "processing" } }
  );
  if (noStatus.modifiedCount > 0) {
    console.log(`[migrate] set status on ${noStatus.modifiedCount} order(s)`);
  }

  // ── 5. Mark pre-existing products as active ───────────────────────────
  const products = mongoose.connection.collection("products");
  const activated = await products.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  if (activated.modifiedCount > 0) {
    console.log(
      `[migrate] marked ${activated.modifiedCount} product(s) active`
    );
  }

  // ── 6. Backfill the catalogue fields added in §1.4 ────────────────────
  const categorised = await products.updateMany(
    { category: { $exists: false } },
    { $set: { category: "laptops", description: "", brand: "" } }
  );
  if (categorised.modifiedCount > 0) {
    console.log(
      `[migrate] backfilled category/description/brand on ${categorised.modifiedCount} product(s)`
    );
  }

  console.log("[migrate] done");
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("[migrate] failed", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
