import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
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

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
