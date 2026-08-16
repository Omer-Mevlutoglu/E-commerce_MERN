/**
 * The single place the app talks to the API.
 *
 * Replaces ~20 hand-written fetch blocks that each rebuilt the base URL, the
 * Authorization header and their own error handling — and none of which noticed
 * an expired token, so a stale session stayed "logged in" until the user
 * happened to hit an endpoint whose failure was visible.
 */

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PREFIX = "/api/v1";

/** Thrown for any non-2xx response, carrying the server's error envelope. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Flattens Zod field errors into one readable line. */
  get fieldMessage(): string {
    if (!this.details) return this.message;
    const first = Object.values(this.details).flat()[0];
    return first ?? this.message;
  }
}

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

/**
 * Wired up by AuthProvider on mount. Keeping these as registered callbacks
 * rather than importing the auth context avoids a circular dependency between
 * the provider and the client it uses.
 */
export const configureApiClient = (config: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) => {
  getToken = config.getToken;
  onUnauthorized = config.onUnauthorized;
};

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Set false for endpoints that must not send credentials. */
  auth?: boolean;
}

export const apiFetch = async <T>(
  path: string,
  { body, auth = true, headers, ...init }: RequestOptions = {}
): Promise<T> => {
  const token = auth ? getToken() : null;

  const response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...init,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // An expired or revoked token now ends the session immediately rather than
  // leaving the UI in a signed-in state that cannot do anything.
  if (response.status === 401 && auth && token) {
    onUnauthorized();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed (${response.status})`,
      payload?.error,
      payload?.details
    );
  }

  return payload as T;
};

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

/** Turns any thrown value into something safe to show a user. */
export const errorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof ApiError) return err.fieldMessage;
  if (err instanceof Error) return err.message;
  return fallback;
};
