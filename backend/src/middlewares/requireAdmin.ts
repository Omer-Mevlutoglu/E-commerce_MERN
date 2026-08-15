import { Response, NextFunction } from "express";
import { ExtenedRequest } from "../types/extendedRequest";

/**
 * Restricts a route to accounts with role "admin".
 * Assumes validateJWT has already run.
 */
const requireAdmin = (
  req: ExtenedRequest,
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
