import { z } from "zod";
import { ORDER_STATUSES } from "../models/orderModel";
import { objectId } from "./common.schema";

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const orderIdParamSchema = z.object({
  orderId: objectId,
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
