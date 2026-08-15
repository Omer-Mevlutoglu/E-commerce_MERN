// routes/adminOrderRoute.ts
import express from "express";
import validateJWT from "../middlewares/validateJWT";
import requireAdmin from "../middlewares/requireAdmin";
import { asyncHandler } from "../utils/asyncHandler";
import { getAllOrders } from "../services/adminOrderService";

const router = express.Router();
router.use(validateJWT, requireAdmin);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const orders = await getAllOrders();
    res.status(200).json(orders);
  })
);

export default router;
