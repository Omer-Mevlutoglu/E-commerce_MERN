import express from "express";
import { getMyOrders } from "../services/userServices";
import validateJWT from "../middlewares/validateJWT";
import requireUser from "../middlewares/requireUser";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../types/authedRequest";

const router = express.Router();

router.use(validateJWT, requireUser);

/** The signed-in customer's own orders, newest first. */
router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const orders = await getMyOrders({ userId: String(req.user._id) });
    res.status(200).json(orders);
  })
);

export default router;
