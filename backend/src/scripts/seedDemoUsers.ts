/**
 * Standalone demo-account seeder, for seeding an already-running deployment
 * without a redeploy:  npm run seed:demo
 *
 * On boot the server does this automatically when SEED_DEMO_USERS=true.
 */
import mongoose from "mongoose";
import { env } from "../config/env";
import { seedDemoUsers } from "../services/demoSeedService";

(async () => {
  await mongoose.connect(env.DATABASE_URL);
  await seedDemoUsers();
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("[seed] failed", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
