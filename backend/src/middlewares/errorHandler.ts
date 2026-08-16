import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

/** Terminal 404 for any route that did not match. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: "NotFound",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

interface ErrorBody {
  error: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * The single place that turns a thrown error into an HTTP response.
 *
 * Replaces fourteen copies of `catch { res.status(500).send("Something went
 * wrong") }`, which discarded the cause and answered every failure — a missing
 * product, a validation slip, a dead database — with the same opaque 500.
 *
 * Must be registered last, and must keep all four parameters: Express
 * identifies error middleware by arity.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  const body: ErrorBody = {
    error: "InternalError",
    message: "Something went wrong",
  };

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    body.error = err.code;
    body.message = err.message;
    if (err.details !== undefined) body.details = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    body.error = "ValidationError";
    body.message = "The submitted data is invalid";
    body.details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
  } else if (err instanceof mongoose.Error.CastError) {
    // e.g. an ObjectId that got past the route because no schema guarded it.
    statusCode = 400;
    body.error = "InvalidId";
    body.message = `Invalid value for ${err.path}`;
  } else if (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  ) {
    statusCode = 409;
    body.error = "DuplicateKey";
    body.message = "A record with that value already exists";
  }

  // 5xx means we did something wrong, so log the whole thing. 4xx is the
  // client's problem and would only add noise.
  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  if (!env.isProduction && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
