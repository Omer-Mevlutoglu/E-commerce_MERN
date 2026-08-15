import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so a rejected promise reaches the central error
 * handler instead of hanging the request.
 *
 * Express 4 does not await handlers, so an async function that throws produces
 * an unhandled rejection and the client waits until it times out. This is why
 * every route used to carry its own try/catch.
 */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
