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
import { ExtenedRequest } from "../types/extendedRequest";

const router = express.Router();

// The cart belongs to customers. Admin tokens were previously accepted here
// because validateJWT alone does not look at the role.
router.use(validateJWT, requireUser);

router.get("/", async (req: ExtenedRequest, res) => {
  try {
    const userId = req.user._id;
    const cart = await getActiveCartForUser({
      userId,
      populateProduct: true,
    });
    res.status(200).send(cart);
  } catch (error) {
    console.error("[cart] GET / failed", error);
    res.status(500).send("Something went wrong");
  }
});

router.post("/items", validate(addItemSchema), async (req: ExtenedRequest, res) => {
  try {
    const userId = req?.user?._id;
    const { productId, quantity } = req.body;
    const response = await addItemToCart({ productId, quantity, userId });
    res.status(response.statusCode).send(response.data);
  } catch (error) {
    console.error("[cart] POST /items failed", error);
    res.status(500).send("Something went wrong");
  }
});

router.put("/items", validate(updateItemSchema), async (req: ExtenedRequest, res) => {
  try {
    const userId = req?.user?._id;
    const { productId, quantity } = req.body;
    const response = await updateItemInCart({ productId, quantity, userId });
    res.status(response.statusCode).send(response.data);
  } catch (error) {
    console.error("[cart] PUT /items failed", error);
    res.status(500).send("Something went wrong");
  }
});

router.delete(
  "/items/:productId",
  validate(productIdParamSchema, "params"),
  async (req: ExtenedRequest, res) => {
    try {
      const userId = req?.user?._id;
      const { productId } = req.params;
      const response = await deleteItemInCart({ productId, userId });
      res.status(response.statusCode).send(response.data);
    } catch (error) {
      console.error("[cart] DELETE /items/:productId failed", error);
      res.status(500).send("Something went wrong");
    }
  }
);

router.delete("/", async (req: ExtenedRequest, res) => {
  try {
    const userId = req?.user?._id;
    const response = await clearCart({ userId });
    res.status(response.statusCode).send(response.data);
  } catch (error) {
    console.error("[cart] DELETE / failed", error);
    res.status(500).send("Something went wrong");
  }
});

router.post(
  "/checkout",
  validate(checkoutSchema),
  async (req: ExtenedRequest, res) => {
    try {
      const userId = req?.user?._id;
      // No card number, CVC or expiry: the browser keeps those.
      const { address, fullName, payment } = req.body;
      const response = await checkOut({ userId, address, fullName, payment });
      res.status(response.statusCode).send(response.data);
    } catch (error) {
      console.error("[cart] POST /checkout failed", error);
      res.status(500).send("Something went wrong");
    }
  }
);

export default router;
