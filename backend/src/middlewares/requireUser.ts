import { Response, NextFunction } from "express";
import { MaybeAuthedRequest } from "../types/authedRequest";

/**
 * Restricts a route to accounts with role "user".
 *
 * Mirrors requireAdmin. Without this, cart and checkout endpoints accepted any
 * authenticated token — including an admin's — even though the UI hides those
 * screens from admins. Shop-facing state belongs to customers only.
 *
 * Assumes validateJWT has already run.
 */
const requireUser = (
  req: MaybeAuthedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "user") {
    res.status(403).json({
      error: "Forbidden",
      message: "This action is only available to customer accounts",
    });
    return;
  }
  next();
};

export default requireUser;
