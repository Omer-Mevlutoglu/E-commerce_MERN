import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import productModel from "../../src/models/productModel";
import { orderModel } from "../../src/models/orderModel";
import { makeAuthedUser, makeProduct, authHeader } from "../factories";

const app = createApp({ enableRateLimit: false });
const idOf = (doc: { _id: unknown }) => String(doc._id);

describe("routing and error shape", () => {
  it("serves /health", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("404s unversioned legacy paths", async () => {
    expect((await request(app).get("/product")).status).toBe(404);
    expect((await request(app).post("/users/login")).status).toBe(404);
  });

  it("returns a JSON envelope for unknown routes", async () => {
    const res = await request(app).get("/api/v1/nope");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "NotFound" });
    expect(res.body.message).toContain("/api/v1/nope");
  });

  it("returns field-level details for a validation failure", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ firstName: "A", lastName: "B", email: "nope", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details.email).toBeDefined();
    expect(res.body.details.password).toBeDefined();
  });

  it("rejects a malformed ObjectId in a route param", async () => {
    const { token } = await makeAuthedUser();

    const res = await request(app)
      .delete("/api/v1/cart/items/not-an-id")
      .set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body.details.productId).toBeDefined();
  });
});

describe("auth endpoints", () => {
  const credentials = {
    firstName: "New",
    lastName: "Person",
    email: "new.person@example.com",
    password: "Password123!",
  };

  it("registers and returns a token", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
  });

  it("always creates a customer, even if a role is supplied", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({ ...credentials, role: "admin" });

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    const payload = JSON.parse(
      Buffer.from(login.body.token.split(".")[1], "base64").toString()
    );
    expect(payload.role).toBe("user");
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    const res = await request(app).post("/api/v1/auth/register").send(credentials);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("EmailTaken");
  });

  it("treats email as case-insensitive", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "New.Person@EXAMPLE.com", password: credentials.password });

    expect(res.status).toBe(200);
  });

  it("logs in with correct credentials", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  // Identical responses stop the endpoint being used to discover which
  // addresses have accounts.
  it("gives the same answer for a wrong password and an unknown email", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);

    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: "WrongPassword1!" });
    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: credentials.password });

    expect(wrongPassword.status).toBe(unknownEmail.status);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("never returns the password hash", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(credentials);

    expect(JSON.stringify(res.body)).not.toContain("$2b$");
  });
});

describe("products", () => {
  it("lists active products without authentication", async () => {
    await makeProduct();
    await makeProduct();

    const res = await request(app).get("/api/v1/products");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("hides retired products from the public catalogue", async () => {
    await makeProduct();
    await makeProduct({ isActive: false });

    const res = await request(app).get("/api/v1/products");

    expect(res.body).toHaveLength(1);
  });
});

describe("admin products", () => {
  it("creates a product", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });

    const res = await request(app)
      .post("/api/v1/admin/products")
      .set(authHeader(token))
      .send({
        title: "MacBook",
        image: "https://example.com/mb.png",
        price: 1999,
        stock: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.isActive).toBe(true);
  });

  it("rejects a negative price", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });

    const res = await request(app)
      .post("/api/v1/admin/products")
      .set(authHeader(token))
      .send({
        title: "Free",
        image: "https://example.com/f.png",
        price: -5,
        stock: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.details.price).toBeDefined();
  });

  it("rejects a non-URL image", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });

    const res = await request(app)
      .post("/api/v1/admin/products")
      .set(authHeader(token))
      .send({ title: "X", image: "not-a-url", price: 1, stock: 1 });

    expect(res.status).toBe(400);
  });

  it("retires rather than deletes, and can restore", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });
    const product = await makeProduct();

    const del = await request(app)
      .delete(`/api/v1/admin/products/${idOf(product)}`)
      .set(authHeader(token));
    expect(del.status).toBe(204);

    // Still present, just retired.
    expect(await productModel.findById(product._id)).not.toBeNull();
    expect((await request(app).get("/api/v1/products")).body).toHaveLength(0);

    const restore = await request(app)
      .post(`/api/v1/admin/products/${idOf(product)}/restore`)
      .set(authHeader(token));
    expect(restore.status).toBe(200);
    expect((await request(app).get("/api/v1/products")).body).toHaveLength(1);
  });

  it("404s when updating a product that does not exist", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });

    const res = await request(app)
      .put("/api/v1/admin/products/000000000000000000000000")
      .set(authHeader(token))
      .send({ price: 10 });

    expect(res.status).toBe(404);
  });

  it("lists retired products for admins", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });
    await makeProduct({ isActive: false });

    const res = await request(app)
      .get("/api/v1/admin/products")
      .set(authHeader(token));

    expect(res.body).toHaveLength(1);
  });
});

describe("cart endpoints", () => {
  it("rejects quantity 0 and negative quantities", async () => {
    const { token } = await makeAuthedUser();
    const product = await makeProduct();

    for (const quantity of [0, -3]) {
      const res = await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(token))
        .send({ productId: idOf(product), quantity });

      expect(res.status).toBe(400);
      expect(res.body.details.quantity).toBeDefined();
    }
  });

  it("returns 409 with a readable message when stock is short", async () => {
    const { token } = await makeAuthedUser();
    const product = await makeProduct({ stock: 2 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(token))
      .send({ productId: idOf(product), quantity: 5 });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/2/);
  });

  it("keeps carts isolated between customers", async () => {
    const a = await makeAuthedUser();
    const b = await makeAuthedUser();
    const product = await makeProduct();

    await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(a.token))
      .send({ productId: idOf(product), quantity: 1 });

    const res = await request(app).get("/api/v1/cart").set(authHeader(b.token));

    expect(res.body.items).toHaveLength(0);
  });
});

describe("full purchase journey", () => {
  it("registers, browses, adds, checks out and sees the order", async () => {
    const product = await makeProduct({ price: 500, stock: 4 });

    // 1. register
    const register = await request(app).post("/api/v1/auth/register").send({
      firstName: "Journey",
      lastName: "Tester",
      email: "journey@example.com",
      password: "Password123!",
    });
    expect(register.status).toBe(201);
    const token = register.body.token;

    // 2. browse
    const catalogue = await request(app).get("/api/v1/products");
    expect(catalogue.body).toHaveLength(1);

    // 3. add to cart, twice — the second call increments
    await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(token))
      .send({ productId: idOf(product), quantity: 1 });
    const cart = await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(token))
      .send({ productId: idOf(product), quantity: 1 });

    expect(cart.body.items).toHaveLength(1);
    expect(cart.body.items[0].quantity).toBe(2);
    expect(cart.body.totalAmount).toBe(1000);

    // 4. check out
    const checkout = await request(app)
      .post("/api/v1/cart/checkout")
      .set(authHeader(token))
      .send({
        fullName: "Journey Tester",
        address: "1 Test Street",
        payment: { last4: "4242", brand: "visa" },
      });

    expect(checkout.status).toBe(201);
    expect(checkout.body.total).toBe(1000);
    expect(checkout.body.orderItems[0].productTitle).toBeDefined();
    expect(checkout.body.orderItems[0].unitPrice).toBe(500);

    // 5. stock came down
    expect((await productModel.findById(product._id))!.stock).toBe(2);

    // 6. cart is empty again
    const afterCart = await request(app)
      .get("/api/v1/cart")
      .set(authHeader(token));
    expect(afterCart.body.items).toHaveLength(0);

    // 7. the order shows up in history
    const orders = await request(app)
      .get("/api/v1/orders")
      .set(authHeader(token));
    expect(orders.body).toHaveLength(1);
    expect(orders.body[0].total).toBe(1000);
    expect(orders.body[0].createdAt).toBeDefined();
  });

  it("shows a customer only their own orders", async () => {
    const a = await makeAuthedUser();
    const b = await makeAuthedUser();
    const product = await makeProduct({ stock: 10 });

    for (const who of [a, b]) {
      await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(who.token))
        .send({ productId: idOf(product), quantity: 1 });
      await request(app)
        .post("/api/v1/cart/checkout")
        .set(authHeader(who.token))
        .send({ fullName: "X", address: "Y" });
    }

    expect(await orderModel.countDocuments()).toBe(2);

    const res = await request(app).get("/api/v1/orders").set(authHeader(a.token));
    expect(res.body).toHaveLength(1);
  });

  it("shows every order to an admin, with customer details", async () => {
    const customer = await makeAuthedUser();
    const admin = await makeAuthedUser({ role: "admin" });
    const product = await makeProduct({ stock: 5 });

    await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.token))
      .send({ productId: idOf(product), quantity: 1 });
    await request(app)
      .post("/api/v1/cart/checkout")
      .set(authHeader(customer.token))
      .send({ fullName: "C", address: "A", payment: { last4: "1111", brand: "visa" } });

    const res = await request(app)
      .get("/api/v1/admin/orders")
      .set(authHeader(admin.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].userId.email).toBe(customer.user.email);
    expect(res.body[0].payment.last4).toBe("1111");
  });

  it("never exposes card data through any order endpoint", async () => {
    const customer = await makeAuthedUser();
    const admin = await makeAuthedUser({ role: "admin" });
    const product = await makeProduct({ stock: 5 });

    await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.token))
      .send({ productId: idOf(product), quantity: 1 });
    await request(app)
      .post("/api/v1/cart/checkout")
      .set(authHeader(customer.token))
      .send({
        fullName: "C",
        address: "A",
        payment: { last4: "4242", brand: "visa" },
        // Even if a client tries to smuggle these through, the schema strips
        // unknown keys and nothing persists them.
        cardNumber: "4242424242424242",
        cvc: "123",
        exp: "12/30",
      });

    const mine = await request(app)
      .get("/api/v1/orders")
      .set(authHeader(customer.token));
    const all = await request(app)
      .get("/api/v1/admin/orders")
      .set(authHeader(admin.token));

    for (const body of [mine.body, all.body]) {
      const raw = JSON.stringify(body);
      expect(raw).not.toContain("4242424242424242");
      expect(raw).not.toContain("cvc");
      expect(raw).not.toContain("cardNumber");
    }
  });
});
