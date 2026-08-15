import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Environment contract. Parsed once, at import time, so a misconfigured
 * deployment fails immediately at boot instead of at the first request.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(3001),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"),
      "DATABASE_URL must be a mongodb:// or mongodb+srv:// connection string"
    ),

  // 32 chars minimum: short secrets make JWT signatures cheap to brute-force.
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_EXPIRES_IN: z.string().default("7d"),

  // Comma-separated list of allowed browser origins.
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");

  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  console.error("See backend/.env.example for the expected variables.\n");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((o) => o.trim()),
  isProduction: parsed.data.NODE_ENV === "production",
};
