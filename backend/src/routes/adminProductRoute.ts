// routes/adminProductRoute.ts
import express, { request, response } from "express";
import { Request, Response, NextFunction } from "express";

import validateJWT from "../middlewares/validateJWT";
import requireAdmin from "../middlewares/requireAdmin";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/adminProductService";

// All endpoints below require BOTH a valid JWT AND user.role==="admin"
const router = express.Router();
router.use(validateJWT, requireAdmin);
// 1) Create a new product
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, image, price, stock } = req.body;
    const newProd = await createProduct({ title, image, price, stock });
    res.status(201).json(newProd);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create product" });
  }
});

// 2) Update an existing product
router.put("/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const updates = req.body; // e.g. { title, price, stock, ... }
    const updatedProd = await updateProduct(productId, updates);
     res.status(200).json(updatedProd);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create product" });
  }
});

// 3) Delete a product
router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    await deleteProduct(productId);
     res.status(200).send("Product deleted");
  } catch (err) {
    console.error(err);
     res.status(500).send("Couldn't delete product");
  }
});

export default router;
