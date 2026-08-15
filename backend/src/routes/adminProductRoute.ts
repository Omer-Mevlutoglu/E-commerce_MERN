// routes/adminProductRoute.ts
import express from "express";
import validateJWT from "../middlewares/validateJWT";
import requireAdmin from "../middlewares/requireAdmin";
import { validate } from "../middlewares/validate";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema";
import { productIdParamSchema } from "../schemas/common.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { getAllProductsForAdmin } from "../services/productService";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} from "../services/adminProductService";

// All endpoints below require BOTH a valid JWT AND user.role === "admin"
const router = express.Router();
router.use(validateJWT, requireAdmin);

/** Admin listing — unlike the public catalogue, includes retired products. */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const products = await getAllProductsForAdmin();
    res.status(200).json(products);
  })
);

router.post(
  "/",
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  })
);

router.put(
  "/:productId",
  validate(productIdParamSchema, "params"),
  validate(updateProductSchema),
  asyncHandler(async (req, res) => {
    const product = await updateProduct(req.params.productId, req.body);
    res.status(200).json(product);
  })
);

/** Retires the product (soft delete). */
router.delete(
  "/:productId",
  validate(productIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    await deleteProduct(req.params.productId);
    res.status(204).send();
  })
);

router.post(
  "/:productId/restore",
  validate(productIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const product = await restoreProduct(req.params.productId);
    res.status(200).json(product);
  })
);

export default router;
