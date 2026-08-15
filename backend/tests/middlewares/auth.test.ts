import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import userModel from "../../src/models/userModel";
import { makeAuthedUser, makeUser, tokenFor, authHeader } from "../factories";

const app = createApp({ enableRateLimit: false });

// Any authenticated route works for exercising the middleware chain.
const PROTECTED = "/api/v1/cart";
const ADMIN_ONLY = "/api/v1/admin/orders";

describe("validateJWT", () => {
  it("rejects a request with no Authorization header", async () => {
    const res = await request(app).get(PROTECTED);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("rejects a header that is not a Bearer scheme", async () => {
    const res = await request(app)
      .get(PROTECTED)
      .set("Authorization", "Basic abc123");

    expect(res.status).toBe(401);
  });

  it("rejects a Bearer header with no token", async () => {
    const res = await request(app)
      .get(PROTECTED)
      .set("Authorization", "Bearer");

    expect(res.status).toBe(401);
  });

  it("rejects a malformed token", async () => {
    const res = await request(app)
      .get(PROTECTED)
      .set("Authorization", "Bearer not.a.jwt");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("InvalidToken");
  });

  it("rejects a token signed with the wrong secret", async () => {
    const { user } = await makeUser();
    const forged = tokenFor(user, { secret: "a-different-secret-32-chars-long!!" });

    const res = await request(app).get(PROTECTED).set(authHeader(forged));

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("InvalidToken");
  });

  it("reports an expired token distinctly so the client can re-authenticate", async () => {
    const { user } = await makeUser();
    const expired = jwt.sign(
      { email: user.email, firstName: "a", lastName: "b", role: "user" },
      process.env.JWT_SECRET!,
      { expiresIn: "-1s" }
    );

    const res = await request(app).get(PROTECTED).set(authHeader(expired));

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("TokenExpired");
  });

  // Before §1.0 this called next() with req.user = null and surfaced as a 500.
  it("rejects a valid token whose account no longer exists", async () => {
    const { user, token } = await makeAuthedUser();
    await userModel.findByIdAndDelete(user._id);

    const res = await request(app).get(PROTECTED).set(authHeader(token));

    expect(res.status).toBe(401);
    expect(res.status).not.toBe(500);
  });

  it("accepts a valid token", async () => {
    const { token } = await makeAuthedUser();

    const res = await request(app).get(PROTECTED).set(authHeader(token));

    expect(res.status).toBe(200);
  });

  it("never returns the password hash on the attached user", async () => {
    const { token } = await makeAuthedUser();

    const res = await request(app).get(PROTECTED).set(authHeader(token));

    expect(JSON.stringify(res.body)).not.toContain("$2b$");
  });
});

describe("requireUser", () => {
  // The cart was previously guarded by validateJWT alone, so an admin's token
  // was accepted even though the UI hides those screens from admins.
  it("rejects an admin token on customer routes", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });

    const res = await request(app).get(PROTECTED).set(authHeader(token));

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("allows a customer token", async () => {
    const { token } = await makeAuthedUser({ role: "user" });

    const res = await request(app).get(PROTECTED).set(authHeader(token));

    expect(res.status).toBe(200);
  });

  it("guards the orders route too", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });

    const res = await request(app).get("/api/v1/orders").set(authHeader(token));

    expect(res.status).toBe(403);
  });
});

describe("requireAdmin", () => {
  it("rejects a customer token on admin routes", async () => {
    const { token } = await makeAuthedUser({ role: "user" });

    const res = await request(app).get(ADMIN_ONLY).set(authHeader(token));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin/i);
  });

  it("rejects an unauthenticated request with 401, not 403", async () => {
    const res = await request(app).get(ADMIN_ONLY);

    // 401 = we do not know who you are; 403 = we do, and you may not.
    expect(res.status).toBe(401);
  });

  it("allows an admin token", async () => {
    const { token } = await makeAuthedUser({ role: "admin" });

    const res = await request(app).get(ADMIN_ONLY).set(authHeader(token));

    expect(res.status).toBe(200);
  });

  it("guards product management as well", async () => {
    const { token } = await makeAuthedUser({ role: "user" });

    const res = await request(app)
      .post("/api/v1/admin/products")
      .set(authHeader(token))
      .send({
        title: "Sneaky",
        image: "https://example.com/x.png",
        price: 1,
        stock: 1,
      });

    expect(res.status).toBe(403);
  });
});
