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
  const { token, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  // Helper function to map raw cart items to our CartItem type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapCartItems = (items: any[]): CartItem[] =>
    items.map(({ product, quantity }) => ({
      productId: product._id,
      image: product.image,
      title: product.title,
      quantity,
      unitPrice: product.price,
      stock: product.stock,
    }));

  const showError = (message: string) => {
    setError(message);
    setOpen(true);
  };

  useEffect(() => {
    if (!token || isAdmin) return;

    const fetchCart = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error("Failed to get user cart. Try again.");
        const data = await response.json();
        setCartItem(mapCartItems(data.items));
        setTotalAmount(data.totalAmount);
      } catch {
        showError("Failed to get cart data");
      }
    };

    fetchCart();
  }, [token, isAdmin]);

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
      setCartItem(mapCartItems(cart.items));
      setTotalAmount(cart.totalAmount);
    } catch {
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
      setCartItem(mapCartItems(cart.items));
      setTotalAmount(cart.totalAmount);
    } catch {
      showError("Can't change the quantity");
    }
  };

  const DeleteItemInCart = async (productId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/cart/items/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        showError("Failed to delete the item.");
        return;
      }
      const cart = await response.json();
      if (!cart) {
        showError("No cart data available.");
        return;
      }
      setCartItem(mapCartItems(cart.items));
      setTotalAmount(cart.totalAmount);
    } catch {
      showError("An error occurred while deleting the item.");
    }
  };

  const ClearCart = async () => {
    try {
      const response = await fetch(`${BASE_URL}/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        showError("Failed to clear cart.");
        return;
      }
      const cart = await response.json();
      if (!cart) {
        showError("No cart data available.");
        return;
      }
      setCartItem([]);
      setTotalAmount(0);
    } catch {
      showError("An error occurred while clearing the cart.");
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
          DeleteItemInCart,
          ClearCart,
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
