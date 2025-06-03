// routes/adminOrderRoute.ts
import express from "express";
import validateJWT from "../middlewares/validateJWT";
import requireAdmin from "../middlewares/requireAdmin";
import { getAllOrders } from "../services/adminOrderService";

const router = express.Router();
router.use(validateJWT, requireAdmin);

router.get("/", async (req, res) => {
  try {
    const orders = await getAllOrders();
     res.status(200).json(orders);
  } catch (err) {
    console.error(err);
     res.status(500).send("Failed to fetch orders");
  }
});

export default router;
