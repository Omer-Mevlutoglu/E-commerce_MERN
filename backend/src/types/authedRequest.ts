import { Request } from "express";
import { IUser } from "../models/userModel";

/**
 * A request that may or may not have been through validateJWT.
 *
 * Used by the guard middlewares themselves, which run before the user is known
 * to exist.
 */
export interface MaybeAuthedRequest extends Request {
  user?: IUser;
}

/**
 * A request that has been through validateJWT, so `user` is guaranteed.
 *
 * Route handlers behind the guards use this and can read `req.user` without a
 * null check — previously `user` was typed `any`, which hid the question
 * entirely rather than answering it.
 */
export interface AuthedRequest extends Request {
  user: IUser;
}
