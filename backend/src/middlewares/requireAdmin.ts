import { Request, Response, NextFunction } from "express";
import { ExtenedRequest } from "../types/extendedRequest";

const requireAdmin = (
  req: ExtenedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
};

export default requireAdmin;
