/**
 * An error the API deliberately raises, carrying the HTTP status and a machine
 * readable code alongside the human message.
 *
 * Services throw these instead of returning `{ data, statusCode }`. That kept
 * business logic coupled to HTTP while still forcing every caller to remember
 * to forward the status — and a service that forgot simply returned 200.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "AppError",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace?.(this, AppError);
  }
}

export const BadRequest = (message: string, code = "BadRequest") =>
  new AppError(400, message, code);

export const Unauthorized = (message: string, code = "Unauthorized") =>
  new AppError(401, message, code);

export const Forbidden = (message: string, code = "Forbidden") =>
  new AppError(403, message, code);

export const NotFound = (message: string, code = "NotFound") =>
  new AppError(404, message, code);

/** 409 — the request was valid but conflicts with current state. */
export const Conflict = (message: string, code = "Conflict") =>
  new AppError(409, message, code);
