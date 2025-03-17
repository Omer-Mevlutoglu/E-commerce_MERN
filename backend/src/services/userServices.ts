import userModel from "../models/userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { orderModel } from "../models/orderModel";

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
}: registerParams) => {
  const findUser = await userModel.findOne({ email });

  if (findUser) {
    return { data: "User already exists", statusCode: 400 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new userModel({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  await newUser.save();
  return { data: generateJwt({ firstName, lastName, email }), statusCode: 200 };
};

interface loginParams {
  email: string;
  password: string;
}

export const login = async ({ email, password }: loginParams) => {
  const findUser = await userModel.findOne({ email });
  if (!findUser) {
    return { data: "Incorrect email or password", statusCode: 400 };
  }

  const passwrodMatch = await bcrypt.compare(password, findUser.password);

  if (passwrodMatch) {
    return {
      data: generateJwt({
        email,
        firstName: findUser.firstName,
        lastName: findUser.lastName,
      }),
      statusCode: 200,
    };
  }

  return { data: "Incorrect email or password", statusCode: 400 };
};

interface getOrdersParams {
  userId: string;
}
export const getMyOrders = async ({ userId }: getOrdersParams) => {
  try {
    return { data: await orderModel.find({ userId }), statusCode: 200 };
  } catch (err) {
    throw err;
  }
};

const generateJwt = (data: any) => {
  return jwt.sign(data, process.env.JWT_SECRET || "");
};
