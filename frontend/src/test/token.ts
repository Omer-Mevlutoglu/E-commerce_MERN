/**
 * Builds an unsigned JWT with a real payload.
 *
 * The frontend only ever decodes tokens (it never verifies them — that is the
 * server's job), so a structurally valid token with a fake signature is enough
 * to drive every client-side code path, including expiry handling.
 */
const b64 = (obj: unknown) =>
  btoa(JSON.stringify(obj))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

export const makeToken = ({
  role = "user",
  email = "test@example.com",
  expiresInSeconds = 3600,
}: {
  role?: "user" | "admin";
  email?: string;
  expiresInSeconds?: number;
} = {}) => {
  const now = Math.floor(Date.now() / 1000);

  return [
    b64({ alg: "HS256", typ: "JWT" }),
    b64({
      email,
      firstName: "Test",
      lastName: "User",
      role,
      iat: now,
      exp: now + expiresInSeconds,
    }),
    "fake-signature",
  ].join(".");
};

export const expiredToken = (role: "user" | "admin" = "user") =>
  makeToken({ role, expiresInSeconds: -60 });
