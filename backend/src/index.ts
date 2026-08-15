import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
// Imported first: parsing the environment fails fast, before anything else runs.
import { env } from "./config/env";
import { seedIntialProducts } from "./services/productService";
import { seedDemoUsers } from "./services/demoSeedService";
import authRoute from "./routes/authRoute";
import productRoute from "./routes/productRoute";
import cartRoute from "./routes/cartRoute";
import orderRoute from "./routes/orderRoute";
import adminProductRoute from "./routes/adminProductRoute";
import adminOrderRoute from "./routes/adminOrderRoute";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

const app = express();

// Railway (and any PaaS load balancer) terminates TLS upstream and forwards
// the real client IP in X-Forwarded-For. Without this, express-rate-limit sees
// every request as coming from the proxy and buckets all users together.
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

const start = async () => {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }

  // seed the default products to db (now that the connection is established)
  await seedIntialProducts();

  if (env.SEED_DEMO_USERS) {
    await seedDemoUsers();
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

  api.use("/auth/login", authLimiter);
  api.use("/auth/register", authLimiter);

  api.use("/auth", authRoute);
  api.use("/products", productRoute);
  api.use("/cart", cartRoute); // singular: a user has exactly one cart
  api.use("/orders", orderRoute);
  api.use("/admin/products", adminProductRoute);
  api.use("/admin/orders", adminOrderRoute);

  app.use("/api/v1", api);

  // Must come after every route, and in this order.
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(env.PORT, () => {
    console.log(`Server is running on ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Platforms send SIGTERM before replacing a container on redeploy. Draining
  // in-flight requests and closing the DB connection avoids dropped responses
  // and half-finished writes mid-deploy.
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);

    const forced = setTimeout(() => {
      console.error("Shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);
    forced.unref();

    server.close(async () => {
      try {
        await mongoose.connection.close(false);
        console.log("Shutdown complete");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown", err);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
};

start().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});
