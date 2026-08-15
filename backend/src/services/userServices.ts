// services/userServices.ts
import userModel from "../models/userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { orderModel } from "../models/orderModel";
import { env } from "../config/env";
import { BadRequest, Conflict } from "../utils/AppError";

// 1) Define the shape of the JWT payload we intend to sign
interface JWTPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
}

// 2) Helper to generate a JWT including the `role` field
const generateJwt = (data: JWTPayload): string => {
  // env.JWT_SECRET is validated at boot, so there is no empty-string fallback.
  return jwt.sign(data, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

interface registerParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const register = async ({
  firstName,
  lastName,
  email,
  password,
}: registerParams): Promise<{ token: string }> => {
  const findUser = await userModel.findOne({ email });
  if (findUser) {
    throw Conflict("An account with that email already exists", "EmailTaken");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // role is never read from input — the schema default makes every
  // self-registered account a plain "user".
  const newUser = await userModel.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  const token = generateJwt({
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    role: newUser.role,
  });

  return { token };
};

interface loginParams {
  email: string;
  password: string;
}

export const login = async ({
  email,
  password,
}: loginParams): Promise<{ token: string }> => {
  // The password hash is select:false on the schema, so it must be explicitly
  // requested here — this is the only place that needs it.
  const findUser = await userModel.findOne({ email }).select("+password");

  // Both failure branches return the same message so the response cannot be
  // used to discover which emails are registered.
  if (!findUser) {
    throw BadRequest("Incorrect email or password", "InvalidCredentials");
  }

  const passwordMatch = await bcrypt.compare(password, findUser.password);
  if (!passwordMatch) {
    throw BadRequest("Incorrect email or password", "InvalidCredentials");
  }

  const token = generateJwt({
    email: findUser.email,
    firstName: findUser.firstName,
    lastName: findUser.lastName,
    role: findUser.role,
  });

  return { token };
};

interface getOrdersParams {
  userId: string;
}

export const getMyOrders = async ({ userId }: getOrdersParams) => {
  return orderModel.find({ userId }).sort({ createdAt: -1 });
};
