import type { Request } from "express";
import jwt from "jsonwebtoken";
import type { AdminProfile } from "@project/contracts";
import { env } from "../config/env.js";

export function extractCaller(req: Request): AdminProfile | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminProfile;
    return decoded;
  } catch {
    return null;
  }
}
