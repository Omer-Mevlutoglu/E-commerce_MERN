import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import bcrypt from "bcrypt";
import { seedDemoUsers } from "../../src/services/demoSeedService";
import { seedIntialProducts } from "../../src/services/productService";
import userModel from "../../src/models/userModel";
import productModel from "../../src/models/productModel";
import { makeProduct } from "../factories";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("seedDemoUsers", () => {
  it("creates one customer and one admin", async () => {
    await seedDemoUsers();

    const customer = await userModel.findOne({ email: "demo@laptopia.dev" });
    const admin = await userModel.findOne({ email: "admin@laptopia.dev" });

    expect(customer?.role).toBe("user");
    expect(admin?.role).toBe("admin");
  });

  it("stores hashed passwords, never plaintext", async () => {
    await seedDemoUsers();

    const admin = await userModel
      .findOne({ email: "admin@laptopia.dev" })
      .select("+password");

    expect(admin!.password).not.toBe("Admin1234!");
    expect(await bcrypt.compare("Admin1234!", admin!.password)).toBe(true);
  });

  // Runs on every boot when SEED_DEMO_USERS is on, so a redeploy must not
  // duplicate accounts or reset a demo user's changes.
  it("is idempotent across repeated runs", async () => {
    await seedDemoUsers();
    await seedDemoUsers();
    await seedDemoUsers();

    expect(await userModel.countDocuments()).toBe(2);
  });

  it("leaves an existing account untouched", async () => {
    await seedDemoUsers();
    await userModel.updateOne(
      { email: "demo@laptopia.dev" },
      { firstName: "Renamed" }
    );

    await seedDemoUsers();

    const user = await userModel.findOne({ email: "demo@laptopia.dev" });
    expect(user!.firstName).toBe("Renamed");
  });
});

describe("seedIntialProducts", () => {
  it("inserts the sample catalogue into an empty database", async () => {
    await seedIntialProducts();

    expect(await productModel.countDocuments()).toBe(3);
  });

  it("does nothing when products already exist", async () => {
    await makeProduct();

    await seedIntialProducts();

    expect(await productModel.countDocuments()).toBe(1);
  });
});
