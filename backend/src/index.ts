import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
// Imported first: parsing the environment fails fast, before anything else runs.
import { env } from "./config/env";
import userRoute from "./routes/userRoute";
import { seedIntialProducts } from "./services/productService";
import productRoute from "./routes/productRoute";
import cartRoute from "./routes/cartRoute";
import adminProductRoute from "./routes/adminProductRoute";
import adminOrderRoute from "./routes/adminOrderRoute";

const app = express();

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

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  app.use("/users/login", authLimiter);
  app.use("/users/register", authLimiter);

  app.use("/users", userRoute);
  app.use("/product", productRoute);
  app.use("/cart", cartRoute);
  app.use("/admin/products", adminProductRoute);
  app.use("/admin/orders", adminOrderRoute);

  app.listen(env.PORT, () => {
    console.log(`Server is running on ${env.PORT}`);
  });
};

start();
