import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // e2e/ holds Playwright specs, which have their own runner.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
    env: {
      VITE_BASE_URL: "http://localhost:3001",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/test/**",
        "src/**/*.d.ts",
        "src/theme/**",
        "src/types/**",
      ],
    },
  },
});
