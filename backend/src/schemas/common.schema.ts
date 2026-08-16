import { z } from "zod";

/** A 24-character hex MongoDB ObjectId. */
export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId");

/** Route params carrying a :productId. */
export const productIdParamSchema = z.object({
  productId: objectId,
});
