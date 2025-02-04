import { Request } from "express";

export interface ExtenedRequest extends Request {
  user?: any;
}
