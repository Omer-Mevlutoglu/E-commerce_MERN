// services/userServices.ts
import userModel from "../models/userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { orderModel } from "../models/orderModel";
import { IUser } from "../models/userModel"; // If you have an IUser interface
import { env } from "../config/env";

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
}: registerParams): Promise<{ data: string; statusCode: number }> => {
  // 1) Check if user already exists
  const findUser = await userModel.findOne({ email });
  if (findUser) {
    return { data: "User already exists", statusCode: 400 };
  }

  // 2) Hash the plain‐text password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3) Create a new user document (role defaults to "user" in schema)
  const newUser = new userModel({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    // role will default to "user"
  });

  // 4) Save to DB
  await newUser.save();

  // 5) Generate a token that includes the role
  const token = generateJwt({
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    role: newUser.role, // "user"
  });

  return { data: token, statusCode: 200 };
};

interface loginParams {
  email: string;
  password: string;
}

export const login = async ({
  email,
  password,
}: loginParams): Promise<{ data: string; statusCode: number }> => {
  // 1) Find user by email.
  //    The password hash is select:false on the schema, so it must be
  //    explicitly requested here — this is the only place that needs it.
  const findUser = await userModel.findOne({ email }).select("+password");
  if (!findUser) {
    return { data: "Incorrect email or password", statusCode: 400 };
  }

  // 2) Compare provided password with hashed password in DB
  const passwordMatch = await bcrypt.compare(password, findUser.password);
  if (!passwordMatch) {
    return { data: "Incorrect email or password", statusCode: 400 };
  }

  // 3) Generate a token that includes the role
  const token = generateJwt({
    email: findUser.email,
    firstName: findUser.firstName,
    lastName: findUser.lastName,
    role: findUser.role, // can be "user" or "admin"
  });

  return { data: token, statusCode: 200 };
};

interface getOrdersParams {
  userId: string;
}

export const getMyOrders = async ({
  userId,
}: getOrdersParams): Promise<{ data: any[]; statusCode: number }> => {
  try {
    const orders = await orderModel.find({ userId }).sort({ createdAt: -1 });
    return { data: orders, statusCode: 200 };
  } catch (err) {
    throw err;
  }
};
