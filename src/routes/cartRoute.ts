import express from "express";
import { getActiveCartForUser } from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";
import { Request, Response } from "express";
interface ExtenedRequest extends Request {
  user?: any;
}

const router = express.Router();

router.get("/", validateJWT, async (req: ExtenedRequest, res) => {
  // getActiveCartForUser
  const userId = req.user._id;
  const cart = await getActiveCartForUser({ userId });
  res.status(200).send(cart);
});

router.post("/product", validateJWT, async (req: ExtenedRequest, res) => {

  


});

export default router;
