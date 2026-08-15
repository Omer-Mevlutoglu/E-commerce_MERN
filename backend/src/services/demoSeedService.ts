import bcrypt from "bcrypt";
import userModel from "../models/userModel";

/**
 * Demo accounts for the public deployment.
 *
 * A reviewer opening the live link will not sign up, and there is no admin
 * self-registration path — promoting a user means editing MongoDB by hand.
 * Seeding these two makes both roles reachable from the README.
 *
 * Guarded by SEED_DEMO_USERS so this never runs against a real database.
 * Existing accounts are left untouched, so a demo user who changes something
 * does not get reset on the next deploy.
 */
const DEMO_USERS = [
  {
    firstName: "Demo",
    lastName: "Customer",
    email: "demo@laptopia.dev",
    password: "Demo1234!",
    role: "user" as const,
  },
  {
    firstName: "Demo",
    lastName: "Admin",
    email: "admin@laptopia.dev",
    password: "Admin1234!",
    role: "admin" as const,
  },
];

export const seedDemoUsers = async (): Promise<void> => {
  for (const demo of DEMO_USERS) {
    const existing = await userModel.findOne({ email: demo.email });

    if (existing) {
      console.log(`[seed] demo user already present: ${demo.email}`);
      continue;
    }

    await userModel.create({
      ...demo,
      password: await bcrypt.hash(demo.password, 10),
    });

    console.log(`[seed] created demo ${demo.role}: ${demo.email}`);
  }
};
