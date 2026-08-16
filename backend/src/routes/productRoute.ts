import express from "express";
import { listProducts, getProductById } from "../services/productService";
import { validate } from "../middlewares/validate";
import {
  listProductsSchema,
  ListProductsInput,
} from "../schemas/product.schema";
import { productIdParamSchema } from "../schemas/common.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { PRODUCT_CATEGORIES } from "../models/productModel";

const router = express.Router();

/** The category list the storefront's tiles are built from. */
router.get("/categories", (_req, res) => {
  res.status(200).json(PRODUCT_CATEGORIES);
});

/** Paginated, filterable, searchable catalogue. */
router.get(
  "/",
  validate(listProductsSchema, "query"),
  asyncHandler(async (req, res) => {
    // includeInactive is admin-only; the public route never honours it.
    const result = await listProducts({
      ...(req.query as unknown as ListProductsInput),
      includeInactive: false,
    });
    res.status(200).json(result);
  })
);

router.get(
  "/:productId",
  validate(productIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const product = await getProductById(req.params.productId);
    res.status(200).json(product);
  })
);

export default router;
