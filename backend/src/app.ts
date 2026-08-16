import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { env } from "./config/env";
import authRoute from "./routes/authRoute";
import productRoute from "./routes/productRoute";
import cartRoute from "./routes/cartRoute";
import orderRoute from "./routes/orderRoute";
import adminProductRoute from "./routes/adminProductRoute";
import adminOrderRoute from "./routes/adminOrderRoute";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/openapi";

interface CreateAppOptions {
  /**
   * Rate limiting is disabled by default under test: the suite fires hundreds
   * of requests from one address, and the limiter would start rejecting them
   * partway through and produce failures unrelated to what is being tested.
   */
  enableRateLimit?: boolean;
}

/**
 * Builds the Express app without binding a port or touching the database.
 *
 * Separated from index.ts so tests can drive the real app through Supertest.
 * Previously importing the entry point started a server as a side effect,
 * which makes it untestable.
 */
export const createApp = ({
  enableRateLimit = env.NODE_ENV !== "test",
}: CreateAppOptions = {}): Express => {
  const app = express();

  // Railway (and any PaaS load balancer) terminates TLS upstream and forwards
  // the real client IP in X-Forwarded-For. Without this, express-rate-limit
  // sees every request as coming from the proxy and buckets all users together.
  if (env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  // Sensible security headers (CSP, HSTS, X-Frame-Options, nosniff, …).
  app.use(helmet());

  // Only the configured storefront origins may call this API from a browser.
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );

  // converts the js object to json
  app.use(express.json({ limit: "100kb" }));

  if (enableRateLimit) {
    // Broad ceiling on any single client.
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: { error: "TooManyRequests", message: "Too many requests" },
      })
    );
  }

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  // Everything lives under a version prefix so a future breaking change can
  // ship as /api/v2 while existing clients keep working.
  const api = express.Router();

  if (enableRateLimit) {
    // Much tighter on the credential endpoints — this is what makes online
    // password guessing impractical.
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      skipSuccessfulRequests: true,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: {
        error: "TooManyRequests",
        message: "Too many attempts, please try again later",
      },
    });

    api.use("/auth/login", authLimiter);
    api.use("/auth/register", authLimiter);
  }

  api.use("/auth", authRoute);
  api.use("/products", productRoute);
  api.use("/cart", cartRoute); // singular: a user has exactly one cart
  api.use("/orders", orderRoute);
  api.use("/admin/products", adminProductRoute);
  api.use("/admin/orders", adminOrderRoute);

  app.use("/api/v1", api);

  // Generated from the same Zod schemas the API validates with, so the docs
  // cannot drift from the behaviour.
  app.get("/api/v1/openapi.json", (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    "/api/docs",
    // helmet's default CSP blocks the inline styles Swagger UI relies on.
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "Laptopia API",
      swaggerOptions: { persistAuthorization: true },
    })
  );

  // Must come after every route, and in this order.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
