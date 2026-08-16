import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import { MaybeAuthedRequest } from "../types/authedRequest";
import { env } from "../config/env";

/**
 * Verifies the bearer token and attaches the corresponding user to the request.
 *
 * Every authentication failure returns 401 (not authenticated). 403 is reserved
 * for the authorization middlewares, which answer a different question:
 * "you are who you say you are, but you may not do this".
 */
const validateJWT = async (
  req: MaybeAuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: "Authorization header missing" });
    return;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Expected an 'Bearer <token>' authorization header",
    });
    return;
  }

  let payload: jwt.JwtPayload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  } catch (err) {
    const expired = err instanceof jwt.TokenExpiredError;
    res.status(401).json({
      error: expired ? "TokenExpired" : "InvalidToken",
      message: expired
        ? "Session expired, please log in again"
        : "Invalid token",
    });
    return;
  }

  if (!payload?.email) {
    res
      .status(401)
      .json({ error: "InvalidToken", message: "Invalid token payload" });
    return;
  }

  try {
    const user = await userModel.findOne({ email: payload.email });

    // The token is well-formed but the account behind it is gone (deleted, or
    // the email changed). Previously this fell through with req.user = null and
    // surfaced as a 500 from whichever handler dereferenced it.
    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "The account for this token no longer exists",
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export default validateJWT;
