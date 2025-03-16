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
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  // Expose a function to trigger an error message via Snackbar
  const showError = (message: string) => {
    setError(message);
    setOpen(true);
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
            stock: product.stock,
          })
        );

        setCartItem([...cartItemsMapped]);
        setTotalAmount(data.totalAmount);
      } catch {
        showError("Failed to get data");
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
        showError(
          "Item already exists in cart or an error has occurred. Check your cart."
        );
        return;
      }

      const cart = await response.json();
      if (!cart) {
        showError("No cart for this user");
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
          stock: product.stock,
        })
      );

      setCartItem([...cartItemsMapped]);
      setTotalAmount(cart.totalAmount);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      showError("Item already exists in cart");
    }
  };

  const updateItemInCart = async (
    productId: string,
    quantity: number,
    stock: number
  ) => {
    try {
      const response = await fetch(`${BASE_URL}/cart/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity, stock }),
      });

      if (!response.ok) {
        showError("Server error");
        return;
      }

      const cart = await response.json();
      if (!cart) {
        showError("No cart for this user");
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
          stock: product.stock,
        })
      );

      setCartItem([...cartItemsMapped]);
      setTotalAmount(cart.totalAmount);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      showError("Can't change the quantity");
    }
  };

  return (
    <>
      <CartContext.Provider
        value={{
          cartItem,
          totalAmount,
          addItemToCart,
          updateItemInCart,
          showError,
        }}
      >
        {children}
      </CartContext.Provider>

      <Snackbar
        open={open}
        autoHideDuration={3000}
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
