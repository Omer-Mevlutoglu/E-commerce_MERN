import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { api, ApiError, configureApiClient, errorMessage } from "./client";
import { server, API, apiError } from "../test/server";

beforeEach(() => {
  configureApiClient({ getToken: () => null, onUnauthorized: () => {} });
});

describe("apiFetch", () => {
  it("prefixes requests with /api/v1", async () => {
    let seen = "";
    server.use(
      http.get(`${API}/products`, ({ request }) => {
        seen = new URL(request.url).pathname;
        return HttpResponse.json([]);
      })
    );

    await api.get("/products");

    expect(seen).toBe("/api/v1/products");
  });

  it("attaches the bearer token when one is available", async () => {
    configureApiClient({ getToken: () => "abc123", onUnauthorized: () => {} });
    let auth: string | null = null;
    server.use(
      http.get(`${API}/cart`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ items: [], totalAmount: 0 });
      })
    );

    await api.get("/cart");

    expect(auth).toBe("Bearer abc123");
  });

  it("omits the token when auth is disabled", async () => {
    configureApiClient({ getToken: () => "abc123", onUnauthorized: () => {} });
    let auth: string | null = "unset";
    server.use(
      http.get(`${API}/products`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json([]);
      })
    );

    await api.get("/products", { auth: false });

    expect(auth).toBeNull();
  });

  it("sends a JSON body with the right content type", async () => {
    let body: unknown;
    let contentType: string | null = null;
    server.use(
      http.post(`${API}/cart/items`, async ({ request }) => {
        contentType = request.headers.get("content-type");
        body = await request.json();
        return HttpResponse.json({ items: [], totalAmount: 0 });
      })
    );

    await api.post("/cart/items", { productId: "x", quantity: 2 });

    expect(contentType).toContain("application/json");
    expect(body).toEqual({ productId: "x", quantity: 2 });
  });

  it("handles a 204 with no body", async () => {
    server.use(
      http.delete(
        `${API}/admin/products/x`,
        () => new HttpResponse(null, { status: 204 })
      )
    );

    await expect(api.delete("/admin/products/x")).resolves.toBeUndefined();
  });

  it("throws ApiError carrying the server's code and message", async () => {
    server.use(
      http.get(`${API}/cart`, () =>
        apiError(409, "InsufficientStock", "Only 2 left in stock")
      )
    );

    await expect(api.get("/cart")).rejects.toBeInstanceOf(ApiError);
    await api.get("/cart").catch((err: ApiError) => {
      expect(err.status).toBe(409);
      expect(err.code).toBe("InsufficientStock");
      expect(err.message).toBe("Only 2 left in stock");
    });
  });

  it("exposes the first field error from a validation failure", async () => {
    server.use(
      http.post(`${API}/auth/register`, () =>
        apiError(400, "ValidationError", "Invalid request body", {
          password: ["Password must be at least 8 characters"],
        })
      )
    );

    await api
      .post("/auth/register", {}, { auth: false })
      .catch((err: ApiError) => {
        expect(err.fieldMessage).toBe("Password must be at least 8 characters");
      });
  });

  it("calls onUnauthorized when a 401 comes back with a token attached", async () => {
    const onUnauthorized = vi.fn();
    configureApiClient({ getToken: () => "expired", onUnauthorized });
    server.use(
      http.get(`${API}/cart`, () =>
        apiError(401, "TokenExpired", "Session expired")
      )
    );

    await api.get("/cart").catch(() => {});

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  // A 401 on a public endpoint is not a sign the session went stale.
  it("does not sign the user out for a 401 on an unauthenticated call", async () => {
    const onUnauthorized = vi.fn();
    configureApiClient({ getToken: () => null, onUnauthorized });
    server.use(
      http.get(`${API}/products`, () => apiError(401, "Unauthorized", "nope"))
    );

    await api.get("/products", { auth: false }).catch(() => {});

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("still throws when the error body is not JSON", async () => {
    server.use(
      http.get(
        `${API}/cart`,
        () => new HttpResponse("gateway timeout", { status: 504 })
      )
    );

    await api.get("/cart").catch((err: ApiError) => {
      expect(err.status).toBe(504);
      expect(err.message).toContain("504");
    });
  });
});

describe("errorMessage", () => {
  it("prefers the field message from an ApiError", () => {
    const err = new ApiError(400, "Invalid request body", "ValidationError", {
      email: ["Must be a valid email address"],
    });

    expect(errorMessage(err, "fallback")).toBe("Must be a valid email address");
  });

  it("uses a plain Error's message", () => {
    expect(errorMessage(new Error("network down"), "fallback")).toBe(
      "network down"
    );
  });

  it("falls back for a non-Error throw", () => {
    expect(errorMessage("something odd", "fallback")).toBe("fallback");
  });
});
