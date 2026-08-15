import express from "express";
import { getAllProducts } from "../services/productService";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const products = await getAllProducts();
    res.status(200).json(products);
  })
);

export default router;
