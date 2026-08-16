import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import AuthProvider from "../context/Auth/AuthProvider";
import CartProvider from "../context/Cart/CartProvider";
import FeedbackProvider from "../context/Feedback/FeedbackProvider";
import ProductDetailPage from "./ProductDetailPage";
import { server, API, mockProduct, emptyCart, apiError } from "../test/server";
import { makeToken } from "../test/token";

const detail = (overrides: Record<string, unknown> = {}) => ({
  ...mockProduct,
  description: "A very fast laptop indeed.",
  brand: "TestBrand",
  category: "gaming",
  ...overrides,
});

const renderDetail = (id = mockProduct._id) =>
  render(
    <FeedbackProvider>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[`/products/${id}`]}>
            <Routes>
              <Route
                path="/products/:productId"
                element={<ProductDetailPage />}
              />
              <Route path="/products" element={<div>CATALOGUE</div>} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </FeedbackProvider>
  );

describe("ProductDetailPage", () => {
  it("renders the product with its description and stock", async () => {
    server.use(
      http.get(`${API}/products/:id`, () => HttpResponse.json(detail()))
    );

    renderDetail();

    // The title appears twice — once in the breadcrumb, once as the heading.
    expect(
      await screen.findByRole("heading", { name: "Test Laptop" })
    ).toBeInTheDocument();
    expect(screen.getByText("A very fast laptop indeed.")).toBeInTheDocument();
    expect(screen.getByText("$1200.00")).toBeInTheDocument();
    // The fixture has 5 in stock, which is the low-stock threshold.
    expect(screen.getByText(/only 5 left in stock/i)).toBeInTheDocument();
  });

  it("shows a plain in-stock count when supply is healthy", async () => {
    server.use(
      http.get(`${API}/products/:id`, () =>
        HttpResponse.json(detail({ stock: 42 }))
      )
    );

    renderDetail();

    expect(await screen.findByText(/42 available/)).toBeInTheDocument();
  });

  it("offers a route back to the catalogue when the product is missing", async () => {
    server.use(
      http.get(`${API}/products/:id`, () =>
        apiError(404, "ProductNotFound", "Product not found")
      )
    );

    renderDetail();

    expect(
      await screen.findByText(/couldn't find that product/i)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /browse all products/i })
    );
    expect(await screen.findByText("CATALOGUE")).toBeInTheDocument();
  });

  it("distinguishes a server failure from a missing product", async () => {
    server.use(
      http.get(`${API}/products/:id`, () =>
        apiError(500, "InternalError", "The catalogue is unavailable")
      )
    );

    renderDetail();

    expect(
      await screen.findByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
    // Not the "couldn't find that product" wording — a 500 is a different case.
    expect(
      screen.queryByText(/couldn't find that product/i)
    ).not.toBeInTheDocument();
  });

  it("tells a guest to log in and disables the button", async () => {
    server.use(
      http.get(`${API}/products/:id`, () => HttpResponse.json(detail()))
    );

    renderDetail();

    const button = await screen.findByRole("button", {
      name: /login to purchase/i,
    });
    expect(button).toBeDisabled();
  });

  it("disables the button when the product is out of stock", async () => {
    localStorage.setItem("token", makeToken({ role: "user" }));
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(emptyCart)),
      http.get(`${API}/products/:id`, () =>
        HttpResponse.json(detail({ stock: 0 }))
      )
    );

    renderDetail();

    expect(
      await screen.findByRole("button", { name: /out of stock/i })
    ).toBeDisabled();
  });

  it("adds the product to the cart and confirms it", async () => {
    localStorage.setItem("token", makeToken({ role: "user" }));
    let addedId: string | undefined;
    server.use(
      http.get(`${API}/cart`, () => HttpResponse.json(emptyCart)),
      http.get(`${API}/products/:id`, () => HttpResponse.json(detail())),
      http.post(`${API}/cart/items`, async ({ request }) => {
        const body = (await request.json()) as { productId: string };
        addedId = body.productId;
        return HttpResponse.json({
          items: [{ product: mockProduct, unitPrice: 1200, quantity: 1 }],
          totalAmount: 1200,
        });
      })
    );

    renderDetail();
    await userEvent.click(
      await screen.findByRole("button", { name: /add to cart/i })
    );

    await waitFor(() => expect(addedId).toBe(mockProduct._id));
    // Success is now signalled, not silent.
    expect(await screen.findByText(/added to your cart/i)).toBeInTheDocument();
  });
});
