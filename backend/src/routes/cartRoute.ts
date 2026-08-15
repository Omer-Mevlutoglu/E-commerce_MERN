import express from "express";
import {
  addItemToCart,
  getActiveCartForUser,
  updateItemInCart,
  deleteItemInCart,
  clearCart,
  checkOut,
} from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";
import requireUser from "../middlewares/requireUser";
import { validate } from "../middlewares/validate";
import {
  addItemSchema,
  updateItemSchema,
  checkoutSchema,
} from "../schemas/cart.schema";
import { productIdParamSchema } from "../schemas/common.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { ExtenedRequest } from "../types/extendedRequest";

const router = express.Router();

// The cart belongs to customers. Admin tokens were previously accepted here
// because validateJWT alone does not look at the role.
router.use(validateJWT, requireUser);

router.get(
  "/",
  asyncHandler(async (req: ExtenedRequest, res) => {
    const cart = await getActiveCartForUser({
      userId: req.user._id,
      populateProduct: true,
    });
    res.status(200).json(cart);
  })
);

router.post(
  "/items",
  validate(addItemSchema),
  asyncHandler(async (req: ExtenedRequest, res) => {
    const { productId, quantity } = req.body;
    const cart = await addItemToCart({
      productId,
      quantity,
      userId: req.user._id,
    });
    res.status(200).json(cart);
  })
);

router.put(
  "/items",
  validate(updateItemSchema),
  asyncHandler(async (req: ExtenedRequest, res) => {
    const { productId, quantity } = req.body;
    const cart = await updateItemInCart({
      productId,
      quantity,
      userId: req.user._id,
    });
    res.status(200).json(cart);
  })
);

router.delete(
  "/items/:productId",
  validate(productIdParamSchema, "params"),
  asyncHandler(async (req: ExtenedRequest, res) => {
    const cart = await deleteItemInCart({
      productId: req.params.productId,
      userId: req.user._id,
    });
    res.status(200).json(cart);
  })
);

router.delete(
  "/",
  asyncHandler(async (req: ExtenedRequest, res) => {
    const cart = await clearCart({ userId: req.user._id });
    res.status(200).json(cart);
  })
);

router.post(
  "/checkout",
  validate(checkoutSchema),
  asyncHandler(async (req: ExtenedRequest, res) => {
    // No card number, CVC or expiry: the browser keeps those.
    const { address, fullName, payment } = req.body;
    const order = await checkOut({
      userId: req.user._id,
      address,
      fullName,
      payment,
    });
    res.status(201).json(order);
  })
);

export default router;
