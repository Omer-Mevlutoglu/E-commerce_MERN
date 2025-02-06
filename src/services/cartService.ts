import { ReturnDocument } from "mongodb";
import { cartModel, Icart, IcartItem } from "../models/cartModel";
import productModel from "../models/productModel";

interface CreateCartForUser {
  userId: string;
}

// this function is used to create a cart for the user in thier first sign up

const createCartForUser = async ({ userId }: CreateCartForUser) => {
  const cart = await cartModel.create({ userId, totalAmount: 0 });
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

// Define an interface to structure the function's parameters
interface AddItemToCart {
  productId: any; // ID of the product being added
  quantity: number; // Quantity of the product being added
  userId: string; // ID of the user adding the item
}

// Function to add an item to the user's shopping cart
export const addItemToCart = async ({
  productId,
  quantity,
  userId,
}: AddItemToCart) => {
  // Retrieve the active cart for the user
  const cart = await getActiveCartForUser({ userId });

  // Check if the product is already in the cart
  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  // If the product is already in the cart, return an error
  if (existInCart) {
    return { data: "Item already exists in cart", statusCode: 400 };
  }

  // Fetch the product from the database using its ID
  const product = await productModel.findById(productId);

  // If the product doesn't exist in the database, return an error
  if (!product) {
    return { data: "Product not found", statusCode: 400 };
  }

  // Check if there is enough stock to fulfill the requested quantity
  if (product.stock < quantity) {
    return { data: "Low stock", statusCode: 400 };
  }

  // Add the product to the cart if all checks pass
  cart.items.push({ product: productId, unitPrice: product.price, quantity });

  // Update the total cart amount by adding the price of the new product
  cart.totalAmount += product.price * quantity;

  // Save the updated cart back to the database
  const updatedCart = await cart.save();

  // Return the updated cart data with a success status
  return { data: updatedCart, statusCode: 200 };
};

interface UpdateItemInCart {
  productId: any; // ID of the product being added
  quantity: number; // Quantity of the product being added
  userId: string; // ID of the user adding the item
}

export const updateItemInCart = async ({
  productId,
  quantity,
  userId,
}: UpdateItemInCart) => {
  const cart = await getActiveCartForUser({ userId });

  // Check if the product is already in the cart
  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  if (!existInCart) {
    return { data: "Item is not in cart", statusCode: 400 };
  }

  const product = await productModel.findById(productId);

  // If the product doesn't exist in the database, return an error
  if (!product) {
    return { data: "Product not found", statusCode: 400 };
  }

  // Check if there is enough stock to fulfill the requested quantity
  if (product.stock < quantity) {
    return { data: "Low stock", statusCode: 400 };
  }

  // calculate the total amount of the items that are already in the cart

  const otherItemsInCart = cart.items.filter(
    (p) => p.product.toString() !== productId
  );

  let total = calculateCartTotalItems({ cartItems: otherItemsInCart });

  // add the new updated product to the total
  existInCart.quantity = quantity;

  total += existInCart.quantity * existInCart.unitPrice;
  cart.totalAmount = total;
  const updatedCart = await cart.save();

  return { data: updatedCart, statusCode: 200 };
};

interface DeleteItemInCart {
  productId: any; // ID of the product being added
  userId: string; // ID of the user adding the item
}
export const deleteItemInCart = async ({
  userId,
  productId,
}: DeleteItemInCart) => {
  const cart = await getActiveCartForUser({ userId });

  // Check if the product is already in the cart
  const existInCart = cart.items.find(
    (p) => p.product.toString() === productId
  );

  if (!existInCart) {
    return { data: "Item is not in cart", statusCode: 400 };
  }

  const otherItemsInCart = cart.items.filter(
    (p) => p.product.toString() !== productId
  );
  const total = calculateCartTotalItems({ cartItems: otherItemsInCart });

  cart.items = otherItemsInCart;
  cart.totalAmount = total;
  const updatedCart = await cart.save();

  return { data: updatedCart, statusCode: 200 };
};

const calculateCartTotalItems = ({ cartItems }: { cartItems: IcartItem[] }) => {
  const total = cartItems.reduce((sum, product) => {
    sum += product.quantity * product.unitPrice;
    return sum;
  }, 0);

  return total;
};

interface ClearCart {
  userId: string;
}

export const clearCart = async ({ userId }: ClearCart) => {
  const cart = await getActiveCartForUser({ userId });
  cart.items = [];
  cart.totalAmount = 0;

  const updatedCart = await cart.save();

  return { data: updatedCart, statusCode: 200 };
};

// ---- this idea dependes on a quanity removal

// interface DeleteItemInCart {
//   productId: any; // ID of the product being added
//   quantity: number; // Quantity of the product being added
//   userId: string; // ID of the user adding the item
// }

// export const deleteItemInCart = async ({
//   productId,
//   quantity,
//   userId,
// }: DeleteItemInCart) => {
//   const cart = await getActiveCartForUser({ userId });

//   // Check if the product is already in the cart
//   const existInCart = cart.items.find(
//     (p) => p.product.toString() === productId
//   );

//   if (!existInCart) {
//     return {
//       data: "There is no item with this id in the cart or the user doesnt have an active cart",
//       statusCode: 400,
//     };
//   }

//   if (quantity <= 0) {
//     return {
//       data: "Entered quantity must be greater than zero",
//       statusCode: 400,
//     };
//   }

//   if (existInCart.quantity > quantity) {
//     existInCart.quantity -= quantity;
//     cart.totalAmount -= quantity * existInCart.unitPrice;
//   } else {
//     cart.totalAmount -= existInCart.quantity * existInCart.unitPrice; // Deduct full price
//     cart.items = cart.items.filter((p) => p.product.toString() !== productId);
//   }

//   const updatedCart = await cart.save();

//   return { data: updatedCart, statusCode: 200 };
// };
