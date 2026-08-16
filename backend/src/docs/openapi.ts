import { z } from "zod";
import { createDocument } from "zod-openapi";
import { registerSchema, loginSchema } from "../schemas/user.schema";
import {
  addItemSchema,
  updateItemSchema,
  checkoutSchema,
} from "../schemas/cart.schema";
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from "../schemas/product.schema";
import { updateOrderStatusSchema } from "../schemas/order.schema";
import { PRODUCT_CATEGORIES } from "../models/productModel";
import { ORDER_STATUSES } from "../models/orderModel";

/**
 * The spec is generated from the same Zod schemas the API validates with, so
 * the documentation cannot drift from the actual behaviour — if a rule changes,
 * the docs change with it.
 */

const errorResponse = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.array(z.string())).optional(),
});

const productResponse = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string(),
  brand: z.string(),
  category: z.enum(PRODUCT_CATEGORIES),
  image: z.string(),
  price: z.number(),
  stock: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedProducts = z.object({
  items: z.array(productResponse),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
});

const cartResponse = z.object({
  _id: z.string(),
  userId: z.string(),
  items: z.array(
    z.object({
      product: productResponse.nullable(),
      unitPrice: z.number(),
      quantity: z.number(),
    })
  ),
  totalAmount: z.number(),
  status: z.enum(["active", "completed"]),
});

const orderResponse = z.object({
  _id: z.string(),
  orderItems: z.array(
    z.object({
      productTitle: z.string(),
      productImage: z.string(),
      unitPrice: z.number(),
      quantity: z.number(),
    })
  ),
  total: z.number(),
  address: z.string(),
  fullName: z.string(),
  status: z.enum(ORDER_STATUSES),
  payment: z.object({
    method: z.string().optional(),
    status: z.string().optional(),
    last4: z.string().optional(),
    brand: z.string().optional(),
  }),
  createdAt: z.string(),
});

const tokenResponse = z.object({ token: z.string() });

const json = (schema: z.ZodType, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const errors = {
  "400": json(errorResponse, "Validation failed"),
  "401": json(errorResponse, "Not authenticated"),
  "403": json(errorResponse, "Authenticated, but not permitted"),
  "404": json(errorResponse, "Not found"),
  "409": json(errorResponse, "Conflicts with current state"),
};

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Laptopia API",
    version: "1.0.0",
    description: [
      "E-commerce API for the Laptopia storefront.",
      "",
      "**Authentication** — send `Authorization: Bearer <token>` from",
      "`/auth/login` or `/auth/register`. The token carries the account's role;",
      "customer endpoints reject admin tokens and vice versa.",
      "",
      "**Card data is never accepted or stored.** Checkout takes only the last",
      "four digits and the card brand, both of which are safe to persist.",
    ].join("\n"),
    license: { name: "ISC" },
  },
  servers: [{ url: "/api/v1", description: "Current version" }],
  tags: [
    { name: "Auth", description: "Registration and sign-in" },
    { name: "Products", description: "The public catalogue" },
    { name: "Cart", description: "Customer cart and checkout" },
    { name: "Orders", description: "Customer order history" },
    { name: "Admin", description: "Product and order management" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create a customer account",
        description:
          "The role is never read from the request — every self-registered account is a customer. Rate limited to 10 attempts per 15 minutes.",
        requestBody: {
          content: { "application/json": { schema: registerSchema } },
        },
        responses: {
          "201": json(tokenResponse, "Account created"),
          "400": errors["400"],
          "409": json(errorResponse, "Email already registered"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in",
        description:
          "A wrong password and an unknown email return an identical response, so the endpoint cannot be used to discover which addresses have accounts.",
        requestBody: {
          content: { "application/json": { schema: loginSchema } },
        },
        responses: {
          "200": json(tokenResponse, "Signed in"),
          "400": json(errorResponse, "Incorrect email or password"),
        },
      },
    },

    "/products": {
      get: {
        tags: ["Products"],
        summary: "List the catalogue",
        description:
          "Paginated, filterable and searchable. Search runs against a weighted text index over title, brand and description. Retired products are excluded.",
        requestParams: {
          query: listProductsSchema.omit({ includeInactive: true }),
        },
        responses: {
          "200": json(paginatedProducts, "A page of products"),
          "400": errors["400"],
        },
      },
    },
    "/products/categories": {
      get: {
        tags: ["Products"],
        summary: "List the available categories",
        responses: {
          "200": json(z.array(z.enum(PRODUCT_CATEGORIES)), "Category slugs"),
        },
      },
    },
    "/products/{productId}": {
      get: {
        tags: ["Products"],
        summary: "Fetch one product",
        requestParams: { path: z.object({ productId: z.string() }) },
        responses: {
          "200": json(productResponse, "The product"),
          "400": errors["400"],
          "404": errors["404"],
        },
      },
    },

    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "The signed-in customer's cart",
        description:
          "Creates an empty cart on first read, so there is no 'no cart yet' case to handle.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": json(cartResponse, "The active cart"),
          "401": errors["401"],
          "403": errors["403"],
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Empty the cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": json(cartResponse, "The emptied cart"),
          "401": errors["401"],
        },
      },
    },
    "/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Add a product to the cart",
        description:
          "Adding a product already in the cart increases its quantity. The combined quantity is checked against stock.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: addItemSchema } },
        },
        responses: {
          "200": json(cartResponse, "The updated cart"),
          "400": errors["400"],
          "404": errors["404"],
          "409": json(errorResponse, "Not enough stock"),
        },
      },
      put: {
        tags: ["Cart"],
        summary: "Set the quantity of a cart line",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: updateItemSchema } },
        },
        responses: {
          "200": json(cartResponse, "The updated cart"),
          "400": errors["400"],
          "404": errors["404"],
          "409": errors["409"],
        },
      },
    },
    "/cart/items/{productId}": {
      delete: {
        tags: ["Cart"],
        summary: "Remove a line from the cart",
        security: [{ bearerAuth: [] }],
        requestParams: { path: z.object({ productId: z.string() }) },
        responses: {
          "200": json(cartResponse, "The updated cart"),
          "404": errors["404"],
        },
      },
    },
    "/cart/checkout": {
      post: {
        tags: ["Cart"],
        summary: "Place an order",
        description: [
          "Decrements stock atomically and, where the database supports it, runs",
          "every write in one transaction. Two simultaneous checkouts for the",
          "last unit cannot both succeed.",
          "",
          "**No card number, CVC or expiry date is accepted.** The browser",
          "tokenises the card and sends only the last four digits and the brand.",
        ].join("\n"),
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: checkoutSchema } },
        },
        responses: {
          "201": json(orderResponse, "The created order"),
          "400": json(errorResponse, "Empty cart or invalid body"),
          "409": json(errorResponse, "A product ran out of stock"),
        },
      },
    },

    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "The signed-in customer's orders",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": json(z.array(orderResponse), "Orders, newest first"),
          "401": errors["401"],
          "403": errors["403"],
        },
      },
    },

    "/admin/products": {
      get: {
        tags: ["Admin"],
        summary: "List every product, retired included",
        security: [{ bearerAuth: [] }],
        requestParams: {
          query: listProductsSchema.omit({ includeInactive: true }),
        },
        responses: {
          "200": json(paginatedProducts, "A page of products"),
          "403": errors["403"],
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a product",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: createProductSchema } },
        },
        responses: {
          "201": json(productResponse, "The created product"),
          "400": errors["400"],
          "403": errors["403"],
        },
      },
    },
    "/admin/products/{productId}": {
      get: {
        tags: ["Admin"],
        summary: "Fetch one product, retired included",
        security: [{ bearerAuth: [] }],
        requestParams: { path: z.object({ productId: z.string() }) },
        responses: {
          "200": json(productResponse, "The product"),
          "404": errors["404"],
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Update a product",
        security: [{ bearerAuth: [] }],
        requestParams: { path: z.object({ productId: z.string() }) },
        requestBody: {
          content: { "application/json": { schema: updateProductSchema } },
        },
        responses: {
          "200": json(productResponse, "The updated product"),
          "400": errors["400"],
          "404": errors["404"],
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Retire a product",
        description:
          "A soft delete. A hard delete left dangling references in every cart still holding the product.",
        security: [{ bearerAuth: [] }],
        requestParams: { path: z.object({ productId: z.string() }) },
        responses: { "204": { description: "Retired" }, "404": errors["404"] },
      },
    },
    "/admin/products/{productId}/restore": {
      post: {
        tags: ["Admin"],
        summary: "Un-retire a product",
        security: [{ bearerAuth: [] }],
        requestParams: { path: z.object({ productId: z.string() }) },
        responses: {
          "200": json(productResponse, "The restored product"),
          "404": errors["404"],
        },
      },
    },
    "/admin/orders": {
      get: {
        tags: ["Admin"],
        summary: "Every order, with customer details",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": json(z.array(orderResponse), "Orders, newest first"),
          "403": errors["403"],
        },
      },
    },
    "/admin/orders/{orderId}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Move an order along its lifecycle",
        security: [{ bearerAuth: [] }],
        requestParams: { path: z.object({ orderId: z.string() }) },
        requestBody: {
          content: { "application/json": { schema: updateOrderStatusSchema } },
        },
        responses: {
          "200": json(orderResponse, "The updated order"),
          "400": errors["400"],
          "403": errors["403"],
          "404": errors["404"],
        },
      },
    },
  },
});
