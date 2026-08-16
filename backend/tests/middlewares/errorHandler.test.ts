import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { errorHandler } from "../../src/middlewares/errorHandler";
import { AppError, Conflict, NotFound } from "../../src/utils/AppError";

/** Minimal Express doubles — enough to capture status and body. */
const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const req = { method: "GET", originalUrl: "/api/v1/test" } as any;
const next = vi.fn();

const handle = (err: unknown) => {
  const res = mockRes();
  errorHandler(err, req, res, next);
  return {
    status: res.status.mock.calls[0][0],
    body: res.json.mock.calls[0][0],
  };
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("errorHandler", () => {
  it("uses the status and code from an AppError", () => {
    const { status, body } = handle(
      NotFound("No such product", "ProductNotFound")
    );

    expect(status).toBe(404);
    expect(body.error).toBe("ProductNotFound");
    expect(body.message).toBe("No such product");
  });

  it("passes through AppError details", () => {
    const { body } = handle(
      new AppError(400, "Bad", "BadRequest", { field: "value" })
    );

    expect(body.details).toEqual({ field: "value" });
  });

  it("maps a Mongoose ValidationError to 400 with field messages", () => {
    const err = new mongoose.Error.ValidationError();
    err.errors = {
      price: { message: "Price cannot be negative" } as any,
    };

    const { status, body } = handle(err);

    expect(status).toBe(400);
    expect(body.error).toBe("ValidationError");
    expect(body.details).toEqual({ price: "Price cannot be negative" });
  });

  it("maps a CastError to 400 rather than a 500", () => {
    const err = new mongoose.Error.CastError("ObjectId", "abc", "productId");

    const { status, body } = handle(err);

    expect(status).toBe(400);
    expect(body.error).toBe("InvalidId");
  });

  it("maps a duplicate-key error to 409", () => {
    const { status, body } = handle({ code: 11000, message: "dup key" });

    expect(status).toBe(409);
    expect(body.error).toBe("DuplicateKey");
  });

  // The message must not leak internals; the detail goes to the logs instead.
  it("hides the detail of an unexpected error behind a generic 500", () => {
    const { status, body } = handle(
      new Error("Mongo connection string with a password in it")
    );

    expect(status).toBe(500);
    expect(body.error).toBe("InternalError");
    expect(body.message).toBe("Something went wrong");
    expect(JSON.stringify(body.message)).not.toContain("password");
  });

  it("logs 5xx but not 4xx", () => {
    handle(Conflict("Out of stock"));
    expect(console.error).not.toHaveBeenCalled();

    handle(new Error("boom"));
    expect(console.error).toHaveBeenCalled();
  });
});
