import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { wireError, FailureCodes } from "@project/contracts";
import type { AdminProfile } from "@project/contracts";
import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  admin?: AdminProfile;
}

export function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(200).json(
      wireError({
        code: FailureCodes.UNAUTHORIZED,
        message: "Authentication token missing or invalid",
      })
    );
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminProfile;
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(200).json(
      wireError({
        code: FailureCodes.UNAUTHORIZED,
        message: "Session expired or invalid token",
      })
    );
  }
}
