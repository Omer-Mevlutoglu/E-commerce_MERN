// routes/adminOrderRoute.ts
import express from "express";
import validateJWT from "../middlewares/validateJWT";
import requireAdmin from "../middlewares/requireAdmin";
import { validate } from "../middlewares/validate";
import {
  updateOrderStatusSchema,
  orderIdParamSchema,
} from "../schemas/order.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { getAllOrders, updateOrderStatus } from "../services/adminOrderService";

const router = express.Router();
router.use(validateJWT, requireAdmin);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const orders = await getAllOrders();
    res.status(200).json(orders);
  })
);

/** Moves an order along its fulfilment lifecycle. */
router.patch(
  "/:orderId/status",
  validate(orderIdParamSchema, "params"),
  validate(updateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await updateOrderStatus(req.params.orderId, req.body.status);
    res.status(200).json(order);
  })
);

export default router;
