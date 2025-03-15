import { FC, PropsWithChildren, useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { CartItem } from "../../types/CartItem";
import { useAuth } from "../Auth/AuthContext";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const CartProvider: FC<PropsWithChildren> = ({ children }) => {
  const [cartItem, setCartItem] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [error, setError] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to get user cart. Try again.");
        }

        const data = await response.json();
        const cartItemsMapped = data.items.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ product, quantity }: { product: any; quantity: number }) => ({
            productId: product._id,
            image: product.image,
            title: product.title,
            quantity,
            unitPrice: product.unitPrice,
          })
        );

        setCartItem([...cartItemsMapped]);
      } catch {
        setError("Failed to get data");
      }
    };

    fetchCart();
  }, [token]);

  const addItemToCart = async (productId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!response.ok) {
        setError("Failed to add to cart ");
      }

      const cart = await response.json();
      if (!cart) {
        setError("No cart for this user ");
      }

      const cartItemsMapped = cart.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ product, quantity }: { product: any; quantity: number }) => ({
          productId: product._id,
          image: product.image,
          title: product.title,
          quantity,
          unitPrice: product.unitPrice,
        })
      );

      setCartItem([...cartItemsMapped]);
      setTotalAmount(cart.totalAmount);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItem,
        totalAmount,
        addItemToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
