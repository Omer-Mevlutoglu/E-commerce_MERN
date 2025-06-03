import express from "express";
import { getMyOrders, login, register } from "../services/userServices";
import { ExtenedRequest } from "../types/extendedRequest";
import validateJWT from "../middlewares/validateJWT";

const router = express.Router();

router.post("/register", async (request, response) => {
  try {
    const { firstName, lastName, email, password } = request.body;
    const result = await register({ firstName, lastName, email, password });
    response.status(result.statusCode).json(result.data);
  } catch (error) {
    response.status(500).send("Something went wrong");
  }
});

router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;
    const result = await login({ email, password });
    response.status(result.statusCode).json(result.data);
  } catch (error) {
    response.status(500).send("Something went wrong");
  }
});

router.get(
  "/my-orders",
  validateJWT,
  async (request: ExtenedRequest, response) => {
    try {
      const userId = request.user._id;
      const { statusCode, data } = await getMyOrders({
        userId,
      });
      response.status(statusCode).send(data);
    } catch (error) {
      response.status(500).send("Something went wrong");
    }
  }
);

export default router;
