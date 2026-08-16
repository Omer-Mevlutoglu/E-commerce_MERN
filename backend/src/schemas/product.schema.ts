import { z } from "zod";
import { PRODUCT_CATEGORIES } from "../models/productModel";

export const createProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  brand: z.string().trim().max(100).optional().default(""),
  category: z.enum(PRODUCT_CATEGORIES).optional().default("laptops"),
  image: z.string().trim().url("Image must be a valid URL"),
  price: z.coerce
    .number()
    .nonnegative("Price cannot be negative")
    .max(1_000_000, "Price is unrealistically high"),
  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock cannot be negative")
    .max(1_000_000),
});

/** Every field optional, but at least one must be present. */
export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/** Query string for the catalogue listing. */
export const listProductsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12),
  search: z.string().trim().max(100).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  sort: z
    .enum(["newest", "price-asc", "price-desc", "title-asc"])
    .default("newest"),
  /** Admin listing only — include retired products. */
  includeInactive: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsInput = z.infer<typeof listProductsSchema>;
