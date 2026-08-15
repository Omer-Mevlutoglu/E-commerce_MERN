import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const API = "http://localhost:3001/api/v1";

export const mockProduct = {
  _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  title: "Test Laptop",
  image: "https://example.com/laptop.png",
  price: 1200,
  stock: 5,
  isActive: true,
};

export const emptyCart = { items: [], totalAmount: 0 };

export const cartWithItem = {
  items: [{ product: mockProduct, unitPrice: 1200, quantity: 2 }],
  totalAmount: 2400,
};

/** Defaults; individual tests override with server.use(...). */
export const handlers = [
  http.get(`${API}/products`, () => HttpResponse.json([mockProduct])),
  http.get(`${API}/cart`, () => HttpResponse.json(emptyCart)),
  http.get(`${API}/orders`, () => HttpResponse.json([])),
];

export const server = setupServer(...handlers);

/** Shorthand for the API's error envelope. */
export const apiError = (
  status: number,
  error: string,
  message: string,
  details?: Record<string, string[]>
) => HttpResponse.json({ error, message, details }, { status });
