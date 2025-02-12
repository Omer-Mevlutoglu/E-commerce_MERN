import express, { response } from "express";
import { login, register } from "../services/userServices";

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

export default router;
