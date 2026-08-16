import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // Unused args are allowed when prefixed with _, which is how the
      // codebase already marks a parameter it must accept but does not read
      // (Express error middleware, for instance).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Mongoose lean() results and populated documents are genuinely dynamic;
      // warn so they stay visible without blocking the build.
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off", // the server logs to stdout by design
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      // Test fixtures assert on loosely-typed API payloads.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Must come last: turns off every rule Prettier owns.
  prettier
);
