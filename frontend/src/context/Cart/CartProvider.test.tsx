import { describe, it, expect } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import AuthProvider from "../Auth/AuthProvider";
import { useAuth } from "../Auth/AuthContext";
import CartProvider from "./CartProvider";
import { useCart } from "./CartContext";
import FeedbackProvider from "../Feedback/FeedbackProvider";
import {
  server,
  API,
  apiError,
  mockProduct,
  cartWithItem,
  emptyCart,
} from "../../test/server";
import { makeToken } from "../../test/token";

const Probe = () => {
  const { cartItem, totalAmount, addItemToCart } = useCart();
  const { logout } = useAuth();

  return (
    <div>
      <span data-testid="count">{cartItem.length}</span>
      <span data-testid="total">{totalAmount}</span>
      <span data-testid="first-price">{cartItem[0]?.unitPrice ?? "-"}</span>
      <span data-testid="first-qty">{cartItem[0]?.quantity ?? "-"}</span>
      <button onClick={() => addItemToCart(mockProduct._id)}>add</button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

// FeedbackProvider owns the snackbar now, so it has to be in the tree for the
// error assertions to have anything to find.
const renderCart = () =>
  render(
    <FeedbackProvider>
      <AuthProvider>
        <CartProvider>
          <Probe />
        </CartProvider>
      </AuthProvider>
    </FeedbackProvider>
  );

const signIn = (role: "user" | "admin" = "user") => {
  localStorage.setItem("token", makeToken({ role }));
  localStorage.setItem("username", "shopper@example.com");
};

describe("CartProvider", () => {
  it("stays empty when signed out and does not call the API", async () => {
    server.use(
      http.get(`${API}/cart`, () => {
        throw new Error("cart should not be fetched while signed out");
      })
    );

    renderCart();

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("loads the cart on sign-in", async () => {
    server.use(http.get(`${API}/cart`, () => HttpResponse.json(cartWithItem)));
    signIn();

    renderCart();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    );
    expect(screen.getByTestId("total")).toHaveTextContent("2400");
    expect(screen.getByTestId("first-qty")).toHaveTextContent("2");
  });

  it("does not load a cart for an admin", async () => {
    server.use(
      http.get(`${API}/cart`, () => {
        throw new Error("admins have no cart");
      })
    );
    signIn("admin");

    renderCart();

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  /**
   * The line price must come from the cart line, not the live product price.
   * Here the catalogue has moved to 1200 while the line was locked at 1000,
   * and the server total (2000) agrees with the line — so must the UI.
   */
  it("uses the snapshotted line price, not the current product price", async () => {
    server.use(
      http.get(`${API}/cart`, () =>
        HttpResponse.json({
          items: [{ product: mockProduct, unitPrice: 1000, quantity: 2 }],
          totalAmount: 2000,
        })
      )
    );
    signIn();

    renderCart();

    await waitFor(() =>
      expect(screen.getByTestId("first-price")).toHaveTextContent("1000")
    );
    expect(screen.getByTestId("total")).toHaveTextContent("2000");
  });

  it("skips lines whose product was retired", async () => {
    server.use(
      http.get(`${API}/cart`, () =>
        HttpResponse.json({
          items: [
            { product: mockProduct, unitPrice: 100, quantity: 1 },
            { product: null, unitPrice: 50, quantity: 1 },
          ],
          totalAmount: 150,
        })
      )
    );
    signIn();

    renderCart();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    );
  });

  // The badge used to keep showing the previous user's count until a reload.
  it("clears the cart on logout", async () => {
    server.use(http.get(`${API}/cart`, () => HttpResponse.json(cartWithItem)));
    signIn();
    renderCart();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    );

    await act(async () => {
      screen.getByText("logout").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    );
    expect(screen.getByTestId("total")).toHaveTextContent("0");
  });

  it("replaces state with the server's cart after adding an item", async () => {
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(emptyCart)),
      http.post(`${API}/cart/items`, () => HttpResponse.json(cartWithItem))
    );
    signIn();
    renderCart();

    await act(async () => {
      screen.getByText("add").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    );
    expect(screen.getByTestId("total")).toHaveTextContent("2400");
  });

  // Users used to see "Server error" regardless of what actually went wrong.
  it("surfaces the server's message when adding fails", async () => {
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(emptyCart)),
      http.post(`${API}/cart/items`, () =>
        apiError(409, "InsufficientStock", "Only 2 left in stock")
      )
    );
    signIn();
    renderCart();

    await act(async () => {
      screen.getByText("add").click();
    });

    expect(await screen.findByText("Only 2 left in stock")).toBeInTheDocument();
  });

  it("leaves the cart unchanged when a mutation fails", async () => {
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(cartWithItem)),
      http.post(`${API}/cart/items`, () =>
        apiError(409, "InsufficientStock", "Only 2 left in stock")
      )
    );
    signIn();
    renderCart();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    );

    await act(async () => {
      screen.getByText("add").click();
    });

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("total")).toHaveTextContent("2400");
  });

  it("shows an error when the initial cart load fails", async () => {
    server.use(
      http.get(`${API}/cart`, () =>
        apiError(500, "InternalError", "Something went wrong")
      )
    );
    signIn();

    renderCart();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
