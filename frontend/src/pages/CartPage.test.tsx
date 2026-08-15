import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import AuthProvider from "../context/Auth/AuthProvider";
import CartProvider from "../context/Cart/CartProvider";
import CartPage from "./CartPage";
import { server, API, mockProduct, emptyCart } from "../test/server";
import { makeToken } from "../test/token";

const cartOf = (quantity: number, stock = 5) => ({
  items: [
    {
      product: { ...mockProduct, stock },
      unitPrice: 1200,
      quantity,
    },
  ],
  totalAmount: 1200 * quantity,
});

const renderCartPage = () => {
  localStorage.setItem("token", makeToken({ role: "user" }));
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
};

describe("CartPage", () => {
  it("shows an empty state with a way back to the shop", async () => {
    server.use(http.get(`${API}/cart`, () => HttpResponse.json(emptyCart)));

    renderCartPage();

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /browse products/i })
    ).toBeInTheDocument();
  });

  it("renders the line, its quantity and the total", async () => {
    server.use(http.get(`${API}/cart`, () => HttpResponse.json(cartOf(2))));

    renderCartPage();

    expect(await screen.findByText("Test Laptop")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/Total: \$2400\.00/)).toBeInTheDocument();
  });

  it("increments the quantity through the API", async () => {
    let sent: { productId?: string; quantity?: number } | undefined;
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(cartOf(1))),
      http.put(`${API}/cart/items`, async ({ request }) => {
        sent = (await request.json()) as { productId: string; quantity: number };
        return HttpResponse.json(cartOf(2));
      })
    );
    renderCartPage();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByRole("button", { name: "+" }));

    await waitFor(() => expect(sent?.quantity).toBe(2));
    expect(await screen.findByText(/Total: \$2400\.00/)).toBeInTheDocument();
  });

  it("decrements the quantity", async () => {
    let sent: { productId?: string; quantity?: number } | undefined;
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(cartOf(3))),
      http.put(`${API}/cart/items`, async ({ request }) => {
        sent = (await request.json()) as { productId: string; quantity: number };
        return HttpResponse.json(cartOf(2));
      })
    );
    renderCartPage();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByRole("button", { name: "-" }));

    await waitFor(() => expect(sent?.quantity).toBe(2));
  });

  // Guarded client-side so the obvious mistake never becomes a round trip;
  // the server enforces it regardless.
  it("refuses to go past the stock ceiling", async () => {
    let called = false;
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(cartOf(5, 5))),
      http.put(`${API}/cart/items`, () => {
        called = true;
        return HttpResponse.json(cartOf(6, 5));
      })
    );
    renderCartPage();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByRole("button", { name: "+" }));

    expect(
      await screen.findByText(/stock limit reached/i)
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("does not send a request for a quantity below one", async () => {
    let called = false;
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(cartOf(1))),
      http.put(`${API}/cart/items`, () => {
        called = true;
        return HttpResponse.json(cartOf(0));
      })
    );
    renderCartPage();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByRole("button", { name: "-" }));

    expect(called).toBe(false);
  });

  it("removes a line", async () => {
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(cartOf(1))),
      http.delete(`${API}/cart/items/:id`, () => HttpResponse.json(emptyCart))
    );
    renderCartPage();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("clears the whole cart", async () => {
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(cartOf(2))),
      http.delete(`${API}/cart`, () => HttpResponse.json(emptyCart))
    );
    renderCartPage();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByRole("button", { name: /clear cart/i }));

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
