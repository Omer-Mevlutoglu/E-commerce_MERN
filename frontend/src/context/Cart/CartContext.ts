import { createContext, useContext } from "react";
import { CartItem } from "../../types/CartItem";

interface CartContextType {
  cartItem: CartItem[];
  totalAmount: number;
  addItemToCart: (productId: string) => void;
  // `stock` was previously passed in and sent to the server, which ignored it —
  // stock is authoritative on the server, never something the client asserts.
  updateItemInCart: (productId: string, quantity: number) => void;
  DeleteItemInCart: (productId: string) => void;
  ClearCart: () => void;
  showError: (message: string) => void;
}

export const CartContext = createContext<CartContextType>({
  cartItem: [],
  totalAmount: 0,
  addItemToCart: () => {},
  updateItemInCart: () => {},
  DeleteItemInCart: () => {},
  ClearCart: () => {},
  showError: () => {},
});

export const useCart = () => useContext(CartContext);
