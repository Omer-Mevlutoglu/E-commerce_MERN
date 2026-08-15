import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "params" | "query";

/**
 * Validates one part of the request against a Zod schema.
 *
 * On success the parsed (and coerced/stripped) value replaces the original,
 * so handlers downstream receive data that is guaranteed to match the schema.
 * On failure it returns 400 with a field-keyed error map.
 */
export const validate =
  (schema: ZodSchema, source: Source = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        error: "ValidationError",
        message: `Invalid request ${source}`,
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    // req.query/req.params are getter-only on some Express versions,
    // so assign through Object.defineProperty-safe reassignment.
    if (source === "body") {
      req.body = result.data;
    } else {
      Object.assign(req[source], result.data);
    }

    next();
  };
