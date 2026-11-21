import type { Request, Response, NextFunction } from "express";
import { wireError, FailureCodes } from "@project/contracts";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[server:error]", err);

  res.status(200).json(
    wireError({
      code: FailureCodes.INTERNAL_ERROR,
      message: err.message || "An unexpected internal server error occurred",
    })
  );
}
