import express, { response } from "express";
import { login, register } from "../services/userServices";

const router = express.Router();

router.post("/register", async (request, respose) => {
  const { firstName, lastName, email, password } = request.body;
  const result = await register({ firstName, lastName, email, password });
  respose.status(result.statusCode).send(result.data);
});

router.post("/login", async (request, response) => {
  const { email, password } = request.body;
  const result = await login({ email, password });
  response.status(result.statusCode).send(result.data);
});
export default router;
