import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // The in-memory MongoDB binary has to download on first run, and the
    // concurrency tests deliberately wait on real writes.
    testTimeout: 30_000,
    hookTimeout: 120_000,

    // Test files share one in-memory replica set and clear collections between
    // tests, so they must not run in parallel against the same data.
    fileParallelism: false,

    // config/env.ts parses these at import time and exits if they are missing.
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-that-is-definitely-long-enough-32",
      JWT_EXPIRES_IN: "7d",
      DATABASE_URL: "mongodb://placeholder:27017/test",
      CORS_ORIGIN: "http://localhost:5173",
    },

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/scripts/**",
        "src/types/**",
        "src/config/env.ts",
      ],
      thresholds: {
        // Where the business logic lives.
        "src/services/**": { statements: 70, branches: 70, functions: 70 },
      },
    },
  },
});
