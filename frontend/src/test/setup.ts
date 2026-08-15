import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

/**
 * MSW intercepts at the network layer, so components and providers run their
 * real fetch code rather than a stubbed client — the request URL, headers and
 * error handling are all genuinely exercised.
 */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
});

afterAll(() => server.close());
