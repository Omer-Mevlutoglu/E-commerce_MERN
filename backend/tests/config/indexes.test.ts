import { describe, it, expect, vi, afterEach } from "vitest";
import productModel from "../../src/models/productModel";
import { orderModel } from "../../src/models/orderModel";
import { cartModel } from "../../src/models/cartModel";
import userModel from "../../src/models/userModel";
import { ensureIndexes } from "../../src/config/indexes";

/**
 * The setup file calls ensureIndexes() after connecting, exactly as the server
 * does at startup. These assert the indexes that carry behaviour, not just
 * speed — a missing text index makes `$text` fail outright rather than run
 * slowly, so search would 500 on a fresh database.
 */
const indexNames = async (model: {
  collection: { indexes(): Promise<unknown[]> };
}) =>
  (await model.collection.indexes()).map((i) => (i as { name: string }).name);

describe("indexes", () => {
  it("creates the catalogue text index that search depends on", async () => {
    expect(await indexNames(productModel)).toContain("product_search");
  });

  it("lets a $text query run without erroring", async () => {
    await productModel.create({
      title: "Thinkpad Carbon",
      image: "https://example.com/t.png",
      price: 100,
      stock: 1,
    });

    const found = await productModel.find({ $text: { $search: "Thinkpad" } });

    expect(found).toHaveLength(1);
  });

  it("indexes the catalogue by active state and category", async () => {
    expect(await indexNames(productModel)).toContain("isActive_1_category_1");
  });

  it("indexes orders by customer and recency", async () => {
    expect(await indexNames(orderModel)).toContain("userId_1_createdAt_-1");
  });

  it("indexes carts by owner and status", async () => {
    expect(await indexNames(cartModel)).toContain("userId_1_status_1");
  });

  it("keeps email unique so duplicate registration is rejected by the database", async () => {
    const indexes = await userModel.collection.indexes();
    const email = indexes.find(
      (i) => (i as { name: string }).name === "email_1"
    );

    expect(email).toBeDefined();
    expect((email as { unique?: boolean }).unique).toBe(true);
  });
});

/**
 * These reproduce an *upgrade*, not a fresh install.
 *
 * The original suite only ever ran against an empty in-memory database, where
 * no superseded index can exist — so it passed while a real developer database
 * carrying the older `title_text` index crashed the server on boot with
 * IndexOptionsConflict. A collection may hold only one text index, so renaming
 * it is a replacement, not an addition.
 */
describe("reconciling an index definition that changed", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    // Leave the database as the rest of the suite expects to find it.
    await productModel.collection.dropIndexes().catch(() => undefined);
    await ensureIndexes();
  });

  it("replaces a superseded text index instead of crashing", async () => {
    // Recreate the pre-§1.4 state exactly: drop the new index, put the old one
    // back under its old name and weights.
    await productModel.collection.dropIndexes();
    await productModel.collection.createIndex(
      { title: "text" },
      { name: "title_text" }
    );
    expect(await indexNames(productModel)).toContain("title_text");

    await expect(ensureIndexes()).resolves.not.toThrow();

    const names = await indexNames(productModel);
    expect(names).toContain("product_search");
    expect(names).not.toContain("title_text");
  });

  it("search works again after reconciling", async () => {
    await productModel.collection.dropIndexes();
    await productModel.collection.createIndex(
      { title: "text" },
      { name: "title_text" }
    );
    await ensureIndexes();

    await productModel.create({
      title: "Reconciled Laptop",
      brand: "Lenovo",
      image: "https://example.com/r.png",
      price: 100,
      stock: 1,
    });

    // Matching on brand proves the *new* multi-field weighting is live, not
    // just that some text index exists.
    const found = await productModel.find({ $text: { $search: "Lenovo" } });
    expect(found).toHaveLength(1);
  });

  it("says what it is doing rather than reconciling silently", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    await productModel.collection.dropIndexes();
    await productModel.collection.createIndex(
      { title: "text" },
      { name: "title_text" }
    );
    await ensureIndexes();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("definition changed")
    );
  });

  it("does not drop or recreate anything when nothing changed", async () => {
    const before = await indexNames(productModel);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await ensureIndexes();

    expect(await indexNames(productModel)).toEqual(before);
    // No conflict, so the reconcile path must not have run.
    expect(warn).not.toHaveBeenCalled();
  });
});
