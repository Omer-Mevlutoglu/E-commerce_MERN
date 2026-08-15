import mongoose from "mongoose";
// Imported first: parsing the environment fails fast, before anything else runs.
import { env } from "./config/env";
import { createApp } from "./app";
import { seedIntialProducts } from "./services/productService";
import { seedDemoUsers } from "./services/demoSeedService";

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

  const app = createApp();

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
