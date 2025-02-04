import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";

interface ExtenedRequest extends Request {
  user?: any;
}

const validateJWT = (
  req: ExtenedRequest,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.get("authorization");

  //   if authorization header not found reurn

  if (!authorizationHeader) {
    res.status(403).send("No authorization header was found");
    return;
  }

  //   authorization header found? get me the token
  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    res.status(403).send("The token was notnfound");
    return;
  }

  jwt.verify(
    token,
    "0LmMIgHM1uVCdTuXIG1j0xKn1CPcKkUX",
    async (err, payload) => {
      if (err) {
        res.status(403).send("Invalid token");
        return;
      }

      // check if the payload is valid
      if (!payload) {
        res.status(403).send("Invalid token payload");
        return;
      }
      // if there is no errors fetch user from the database based on the payload
      // specify the type of email
      const userPayload = payload as {
        email: string;
        firstName: string;
        lastName: string;
      };

      const user = await userModel.findOne({ email: userPayload.email });
      req.user = user;

      next();
    }
  );
};

export default validateJWT;
