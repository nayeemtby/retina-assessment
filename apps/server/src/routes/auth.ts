import { Router } from "express";
import {
  AdminBootstrapRequestSchema,
  AdminLoginRequestSchema,
} from "@project/contracts";
import { validateBody } from "../middleware/validate.js";
import { createBootstrapShell } from "../operations/auth/bootstrap/shell.js";
import { createLoginShell } from "../operations/auth/login/shell.js";
import { createMeShell } from "../operations/auth/me/shell.js";

export const authRouter = Router();

// Public: Bootstrap first administrator
authRouter.post(
  "/bootstrap",
  validateBody(AdminBootstrapRequestSchema),
  createBootstrapShell()
);

// Public: Admin login
authRouter.post(
  "/login",
  validateBody(AdminLoginRequestSchema),
  createLoginShell()
);

// Protected: Get current admin profile (Auth verified in Functional Core)
authRouter.get("/me", createMeShell());
