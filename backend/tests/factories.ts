import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../src/models/userModel";
import productModel from "../src/models/productModel";
import { cartModel } from "../src/models/cartModel";
import { env } from "../src/config/env";

let counter = 0;
const unique = () => `${Date.now()}-${counter++}`;

export const makeProduct = (overrides: Partial<{
  title: string;
  image: string;
  price: number;
  stock: number;
  isActive: boolean;
}> = {}) =>
  productModel.create({
    title: `Laptop ${unique()}`,
    image: "https://example.com/laptop.png",
    price: 100,
    stock: 10,
    ...overrides,
  });

export const makeUser = async (
  overrides: Partial<{
    email: string;
    password: string;
    role: "user" | "admin";
    firstName: string;
    lastName: string;
  }> = {}
) => {
  const password = overrides.password ?? "Password123!";

  const user = await userModel.create({
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "User",
    email: overrides.email ?? `user-${unique()}@example.com`,
    password: await bcrypt.hash(password, 10),
    role: overrides.role ?? "user",
  });

  return { user, password };
};

/** Signs a token the same way the auth service does. */
export const tokenFor = (
  user: { email: string; firstName: string; lastName: string; role: string },
  overrides: { expiresIn?: string; secret?: string } = {}
) =>
  jwt.sign(
    {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    overrides.secret ?? env.JWT_SECRET,
    { expiresIn: (overrides.expiresIn ?? "7d") as jwt.SignOptions["expiresIn"] }
  );

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/** A user plus a signed token, the usual starting point for route tests. */
export const makeAuthedUser = async (
  overrides: Parameters<typeof makeUser>[0] = {}
) => {
  const { user, password } = await makeUser(overrides);
  return { user, password, token: tokenFor(user) };
};

export const makeCartWith = (
  userId: unknown,
  items: { product: unknown; unitPrice: number; quantity: number }[]
) =>
  cartModel.create({
    userId,
    items,
    totalAmount: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    status: "active",
  });
