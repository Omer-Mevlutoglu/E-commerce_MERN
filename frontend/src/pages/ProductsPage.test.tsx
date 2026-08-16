import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import AuthProvider from "../context/Auth/AuthProvider";
import CartProvider from "../context/Cart/CartProvider";
import FeedbackProvider from "../context/Feedback/FeedbackProvider";
import ProductsPage from "./ProductsPage";
import { server, API, mockProduct } from "../test/server";

type CatalogueItem = typeof mockProduct;

const page = (items: CatalogueItem[], overrides = {}) => ({
  items,
  page: 1,
  limit: 12,
  total: items.length,
  totalPages: 1,
  hasNextPage: false,
  ...overrides,
});

/** Captures the query string the page actually asked the API for. */
let lastQuery: URLSearchParams;

const withCatalogue = (
  respond: (params: URLSearchParams) => ReturnType<typeof page> = () =>
    page([mockProduct])
) =>
  server.use(
    http.get(`${API}/products`, ({ request }) => {
      lastQuery = new URL(request.url).searchParams;
      return HttpResponse.json(respond(lastQuery));
    })
  );

const renderProducts = (initialEntry = "/products") =>
  render(
    <FeedbackProvider>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/products" element={<ProductsPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </FeedbackProvider>
  );

describe("ProductsPage", () => {
  it("renders the catalogue and the result count", async () => {
    withCatalogue(() =>
      page([mockProduct, { ...mockProduct, _id: "b", title: "Second Laptop" }])
    );

    renderProducts();

    expect(await screen.findByText("Test Laptop")).toBeInTheDocument();
    expect(screen.getByText("Second Laptop")).toBeInTheDocument();
    expect(screen.getByText("2 products available")).toBeInTheDocument();
  });

  it("asks for the first page with a default sort", async () => {
    withCatalogue();

    renderProducts();

    await waitFor(() => expect(lastQuery).toBeDefined());
    expect(lastQuery.get("page")).toBe("1");
    expect(lastQuery.get("sort")).toBe("newest");
  });

  it("shows an empty state with a way to clear filters", async () => {
    withCatalogue(() => page([]));

    renderProducts("/products?search=nothingmatches");

    expect(
      await screen.findByText(/no products match your search/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /clear filters/i })
    ).toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    server.use(
      http.get(`${API}/products`, () =>
        HttpResponse.json(
          { error: "InternalError", message: "The catalogue is unavailable" },
          { status: 500 }
        )
      )
    );

    renderProducts();

    // The panel's own heading, plus the server's message underneath it.
    expect(
      await screen.findByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("The catalogue is unavailable")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  // The filter lives in the URL so it can be linked and navigated back to.
  it("reads the category filter from the URL", async () => {
    withCatalogue();

    renderProducts("/products?category=gaming");

    await waitFor(() => expect(lastQuery?.get("category")).toBe("gaming"));
  });

  it("applies a category when its chip is clicked", async () => {
    withCatalogue();
    renderProducts();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByRole("button", { name: /🎮 Gaming/ }));

    await waitFor(() => expect(lastQuery.get("category")).toBe("gaming"));
  });

  it("changes the sort order", async () => {
    withCatalogue();
    renderProducts();
    await screen.findByText("Test Laptop");

    await userEvent.click(screen.getByLabelText("Sort by"));
    await userEvent.click(
      await screen.findByRole("option", { name: /price: low to high/i })
    );

    await waitFor(() => expect(lastQuery.get("sort")).toBe("price-asc"));
  });

  it("debounces the search box into a single request", async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/products`, ({ request }) => {
        calls += 1;
        lastQuery = new URL(request.url).searchParams;
        return HttpResponse.json(page([mockProduct]));
      })
    );
    renderProducts();
    await screen.findByText("Test Laptop");
    const before = calls;

    await userEvent.type(screen.getByLabelText("Search"), "thinkpad");

    await waitFor(() => expect(lastQuery.get("search")).toBe("thinkpad"), {
      timeout: 3000,
    });
    // One extra request for eight keystrokes, not eight.
    expect(calls - before).toBeLessThanOrEqual(2);
  });

  it("shows pagination only when there is more than one page", async () => {
    withCatalogue(() => page([mockProduct], { totalPages: 1 }));
    const { unmount } = renderProducts();
    await screen.findByText("Test Laptop");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    unmount();

    withCatalogue(() =>
      page([mockProduct], { totalPages: 3, total: 30, hasNextPage: true })
    );
    renderProducts();
    await screen.findByText("Test Laptop");

    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it("requests the next page when a page number is clicked", async () => {
    withCatalogue(() =>
      page([mockProduct], { totalPages: 3, total: 30, hasNextPage: true })
    );
    renderProducts();
    await screen.findByText("Test Laptop");

    const pager = await screen.findByRole("navigation");
    await userEvent.click(
      within(pager).getByRole("button", { name: /page 2/i })
    );

    await waitFor(() => expect(lastQuery.get("page")).toBe("2"));
  });
});
