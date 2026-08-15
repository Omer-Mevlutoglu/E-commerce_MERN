import { FC, PropsWithChildren, useCallback, useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { CartItem } from "../../types/CartItem";
import { useAuth } from "../Auth/AuthContext";
import { Alert, Snackbar } from "@mui/material";
import { api, errorMessage } from "../../api/client";

interface ServerCart {
  items: {
    product: {
      _id: string;
      image: string;
      title: string;
      price: number;
      stock: number;
    } | null;
    unitPrice: number;
    quantity: number;
  }[];
  totalAmount: number;
}

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

  const showError = useCallback((message: string) => {
    setError(message);
    setOpen(true);
  }, []);

  /**
   * Flattens the server's populated cart.
   *
   * `unitPrice` comes from the cart line, not from `product.price`. The line
   * price is snapshotted when the item is added, and the server's totalAmount
   * is computed from it — reading the live product price here made the line
   * items and the total disagree whenever an admin changed a price.
   *
   * A null product means it was retired after being added, so it is dropped.
   */
  const mapCartItems = (cart: ServerCart): CartItem[] =>
    cart.items
      .filter((item) => item.product !== null)
      .map(({ product, quantity, unitPrice }) => ({
        productId: product!._id,
        image: product!.image,
        title: product!.title,
        quantity,
        unitPrice,
        stock: product!.stock,
      }));

  const applyCart = useCallback((cart: ServerCart) => {
    setCartItem(mapCartItems(cart));
    setTotalAmount(cart.totalAmount);
  }, []);

  useEffect(() => {
    // Logging out (or signing in as an admin) must clear the cart. Previously
    // this returned early without resetting, so the navbar badge kept showing
    // the previous user's item count until a full page reload.
    if (!token || isAdmin) {
      setCartItem([]);
      setTotalAmount(0);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const cart = await api.get<ServerCart>("/cart");
        if (!cancelled) applyCart(cart);
      } catch (err) {
        if (!cancelled) showError(errorMessage(err, "Failed to get cart data"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, isAdmin, applyCart, showError]);

  const addItemToCart = async (productId: string) => {
    try {
      applyCart(await api.post<ServerCart>("/cart/items", { productId, quantity: 1 }));
    } catch (err) {
      showError(errorMessage(err, "Could not add that item to your cart"));
    }
  };

  const updateItemInCart = async (productId: string, quantity: number) => {
    try {
      applyCart(await api.put<ServerCart>("/cart/items", { productId, quantity }));
    } catch (err) {
      showError(errorMessage(err, "Could not change the quantity"));
    }
  };

  const DeleteItemInCart = async (productId: string) => {
    try {
      applyCart(await api.delete<ServerCart>(`/cart/items/${productId}`));
    } catch (err) {
      showError(errorMessage(err, "Failed to remove the item"));
    }
  };

  const ClearCart = async () => {
    try {
      applyCart(await api.delete<ServerCart>("/cart"));
    } catch (err) {
      showError(errorMessage(err, "Failed to clear the cart"));
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
        autoHideDuration={4000}
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
