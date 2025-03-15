import { FC, PropsWithChildren, useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { CartItem } from "../../types/CartItem";
import { useAuth } from "../Auth/AuthContext";
import { Alert, Snackbar } from "@mui/material";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const CartProvider: FC<PropsWithChildren> = ({ children }) => {
  const [cartItem, setCartItem] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    // If the user clicks away or the autoHideDuration expires, close the Snackbar
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

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
            unitPrice: product.price,
          })
        );

        setCartItem([...cartItemsMapped]);
        setTotalAmount(data.totalAmount);
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
        setError(
          "Item already exists in cart or an error has occured check your cart "
        );

        setOpen(true);
        return;
      }

      const cart = await response.json();
      if (!cart) {
        setError("No cart for this user");
        setOpen(true);
        return;
      }

      const cartItemsMapped = cart.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ product, quantity }: { product: any; quantity: number }) => ({
          productId: product._id,
          image: product.image,
          title: product.title,
          quantity,
          unitPrice: product.price,
        })
      );

      setCartItem([...cartItemsMapped]);
      setTotalAmount(cart.totalAmount);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Item already exists in cart");
      setOpen(true);
    }
  };

  return (
    <>
      <CartContext.Provider
        value={{
          cartItem,
          totalAmount,
          addItemToCart,
        }}
      >
        {children}
      </CartContext.Provider>

      {/* Snackbar with an Alert to show error messages */}
      <Snackbar
        open={open}
        autoHideDuration={3000} // Hide after 3 seconds
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CartProvider;
