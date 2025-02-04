import { cartModel } from "../models/cartModel";

interface CreateCartForUser {
  userId: string;
}

// this function is used to create a cart for the user in thier first sign up

const createCartForUser = async ({ userId }: CreateCartForUser) => {
  const cart = await cartModel.create({ userId, totalAmount: 100 });
  await cart.save();
  return cart;
};

interface GetActiveCartForUser {
  userId: string;
}

// this function checks if the user has an active cart or not
// if the user have an active cart it returns it if not it creates one using the
// createCartForUser function and retursn it all depends on the user id

export const getActiveCartForUser = async ({
  userId,
}: GetActiveCartForUser) => {
  let cart = await cartModel.findOne({ userId, status: "active" });

  if (!cart) {
    cart = await createCartForUser({ userId });
  }
  return cart;
};
