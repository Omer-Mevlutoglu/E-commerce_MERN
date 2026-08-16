import { Model } from "mongoose";
import productModel from "../models/productModel";
import userModel from "../models/userModel";
import { orderModel } from "../models/orderModel";
import { cartModel } from "../models/cartModel";

/**
 * MongoDB rejects an index whose key pattern matches an existing one but whose
 * name or options differ.
 *
 *   85 IndexOptionsConflict   — same key, different name/weights/options
 *   86 IndexKeySpecsConflict  — same name, different key
 *
 * This is how a *renamed or redefined* index shows up. It bites hardest with
 * text indexes, because a collection may only have one: renaming
 * `title_text` to `product_search` is not "add an index", it is "replace the
 * one text index", and `createIndexes` has no way to express that.
 */
const INDEX_CONFLICT_CODES = [85, 86];

const isIndexConflict = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  INDEX_CONFLICT_CODES.includes((err as { code?: number }).code ?? 0);

/**
 * Builds one model's indexes, reconciling a changed definition if it finds one.
 *
 * The happy path is `createIndexes`, which only adds what is missing and never
 * drops anything. `syncIndexes` — which *does* drop indexes that are no longer
 * in the schema — is used only after a conflict, where dropping the superseded
 * index is precisely the intent.
 */
const ensureModelIndexes = async (model: Model<never>): Promise<void> => {
  try {
    await model.createIndexes();
  } catch (err) {
    if (!isIndexConflict(err)) throw err;

    console.warn(
      `[indexes] ${model.modelName}: an index definition changed since this ` +
        `database was created. Reconciling (superseded indexes will be dropped).`
    );

    await model.syncIndexes();

    console.log(`[indexes] ${model.modelName}: reconciled`);
  }
};

/**
 * Builds every schema index before the server accepts traffic.
 *
 * Mongoose creates indexes in the background by default, so on a fresh database
 * there is a window where they do not exist yet. That is harmless for the
 * indexes that only affect speed — but the catalogue's text index is different:
 * a `$text` query against a collection without one fails outright with
 * "text index required for $text query", so search would 500 until the build
 * finished. Awaiting this at startup closes that window.
 */
export const ensureIndexes = async (): Promise<void> => {
  const models = [
    productModel,
    userModel,
    orderModel,
    cartModel,
  ] as unknown as Model<never>[];

  // Sequential rather than parallel: if one has to reconcile, its warning
  // should not be interleaved with three other models' output.
  for (const model of models) {
    await ensureModelIndexes(model);
  }
};
