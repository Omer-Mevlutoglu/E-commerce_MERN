import express from "express";
import { login, register } from "../services/userServices";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../schemas/user.schema";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const result = await register({ firstName, lastName, email, password });
    res.status(201).json(result);
  })
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await login({ email, password });
    res.status(200).json(result);
  })
);

export default router;
