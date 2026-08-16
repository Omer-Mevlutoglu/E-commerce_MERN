import { z } from "zod";
import { objectId } from "./common.schema";

export const addItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero")
    .max(99, "Quantity may not exceed 99"),
});

export const updateItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero")
    .max(99, "Quantity may not exceed 99"),
});

/**
 * Checkout payload.
 *
 * Deliberately carries NO card number, CVC or expiry date. The browser
 * tokenises the card (here: derives a display-only `last4`/`brand`) and the
 * server only ever sees values that are safe to persist. Storing a CVC is
 * prohibited by PCI DSS under any circumstances.
 */
export const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  address: z.string().trim().min(1, "Address is required").max(500),
  payment: z
    .object({
      last4: z.string().regex(/^\d{4}$/, "last4 must be exactly 4 digits"),
      brand: z
        .enum(["visa", "mastercard", "amex", "discover", "unknown"])
        .default("unknown"),
    })
    .optional(),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
