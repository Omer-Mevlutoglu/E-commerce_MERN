import express from "express";
import {
  addItemToCart,
  getActiveCartForUser,
  updateItemInCart,
  deleteItemInCart,
  clearCart,
} from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";
import { Request, Response } from "express";
import { ExtenedRequest } from "../types/extendedRequest";

const router = express.Router();

router.get("/", validateJWT, async (req: ExtenedRequest, res) => {
  // getActiveCartForUser
  const userId = req.user._id;
  const cart = await getActiveCartForUser({ userId });
  res.status(200).send(cart);
});

router.post("/items", validateJWT, async (req: ExtenedRequest, res) => {
  const userId = req?.user?._id;

  const { productId, quantity } = req.body;

  const response = await addItemToCart({ productId, quantity, userId });
  res.status(response.statusCode).send(response.data);
});

router.put("/items", validateJWT, async (req: ExtenedRequest, res) => {
  const userId = req?.user?._id;
  const { productId, quantity } = req.body;

  const response = await updateItemInCart({ productId, quantity, userId });
  res.status(response.statusCode).send(response.data);
});

router.delete(
  "/items/:productId",
  validateJWT,
  async (req: ExtenedRequest, res) => {
    const userId = req?.user?._id;
    const { productId } = req.params;
    const response = await deleteItemInCart({ productId, userId });
    res.status(response.statusCode).send(response.data);
  }
);

router.delete("/items", validateJWT, async (req: ExtenedRequest, res) => {
  const userId = req?.user?._id;

  const response = await clearCart({ userId });

  res.status(response.statusCode).send(response.data);
});

//--- route for the idea depends on the quantity removal
// router.delete("/items", validateJWT, async (req: ExtenedRequest, res) => {
//   const userId = req?.user?._id;
//   const { productId, quantity } = req.body;
//   const response = await deleteItemInCart({ productId, quantity, userId });
//   res.status(response.statusCode).send(response.data);
// });
export default router;
