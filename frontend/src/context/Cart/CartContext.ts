import { createContext, useContext } from "react";
import { CartItem } from "../../types/CartItem";

interface CartContextType {
  cartItem: CartItem[];
  totalAmount: number;
  addItemToCart: (productId: string) => void;
  updateItemInCart: (productId: string, quantity: number, stock: number) => void;
  showError: (message: string) => void;
}

export const CartContext = createContext<CartContextType>({
  cartItem: [],
  totalAmount: 0,
  addItemToCart: () => {},
  updateItemInCart: () => {},
  showError: () => {},
});

export const useCart = () => useContext(CartContext);
