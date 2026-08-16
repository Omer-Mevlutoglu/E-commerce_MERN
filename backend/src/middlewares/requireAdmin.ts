import { Response, NextFunction } from "express";
import { MaybeAuthedRequest } from "../types/authedRequest";

/**
 * Restricts a route to accounts with role "admin".
 * Assumes validateJWT has already run.
 */
const requireAdmin = (
  req: MaybeAuthedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "admin") {
    res
      .status(403)
      .json({ error: "Forbidden", message: "Admin access required" });
    return;
  }
  next();
};

export default requireAdmin;
