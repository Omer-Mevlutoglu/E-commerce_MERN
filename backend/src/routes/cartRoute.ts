import express, { response } from "express";
import {
  addItemToCart,
  getActiveCartForUser,
  updateItemInCart,
  deleteItemInCart,
  clearCart,
  checkOut,
} from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";
import { Request, Response } from "express";
import { ExtenedRequest } from "../types/extendedRequest";

const router = express.Router();

router.get("/", validateJWT, async (req: ExtenedRequest, res) => {
  try {
    const userId = req.user._id;
    const cart = await getActiveCartForUser({
      userId,
      populateProduct: true,
    });
    res.status(200).send(cart);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

router.post("/items", validateJWT, async (req: ExtenedRequest, res) => {
  try {
    const userId = req?.user?._id;
    const { productId, quantity } = req.body;
    const response = await addItemToCart({ productId, quantity, userId });
    res.status(response.statusCode).send(response.data);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

router.put("/items", validateJWT, async (req: ExtenedRequest, res) => {
  try {
    const userId = req?.user?._id;
    const { productId, quantity } = req.body;
    const response = await updateItemInCart({ productId, quantity, userId });
    res.status(response.statusCode).send(response.data);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

router.delete(
  "/items/:productId",
  validateJWT,
  async (req: ExtenedRequest, res) => {
    try {
      const userId = req?.user?._id;
      const { productId } = req.params;
      const response = await deleteItemInCart({ productId, userId });
      res.status(response.statusCode).send(response.data);
    } catch (error) {
      res.status(500).send("Something went wrong");
    }
  }
);

router.delete("/items", validateJWT, async (req: ExtenedRequest, res) => {
  try {
    const userId = req?.user?._id;
    const response = await clearCart({ userId });
    res.status(response.statusCode).send(response.data);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

router.post("/checkout", validateJWT, async (req: ExtenedRequest, res) => {
  try {
    const userId = req?.user?._id;
    const { address } = req.body;
    const response = await checkOut({ userId, address });
    res.status(response.statusCode).send(response.data);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

//--- route for the idea depends on the quantity removal
// router.delete("/items", validateJWT, async (req: ExtenedRequest, res) => {
//   const userId = req?.user?._id;
//   const { productId, quantity } = req.body;
//   const response = await deleteItemInCart({ productId, quantity, userId });
//   res.status(response.statusCode).send(response.data);
// });
export default router;
