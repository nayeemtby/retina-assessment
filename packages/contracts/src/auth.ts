import { z } from "zod";

export const AdminBootstrapRequestSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  email: z.string().trim().email("Invalid email format").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminBootstrapRequest = z.infer<typeof AdminBootstrapRequestSchema>;

export const AdminLoginRequestSchema = z.object({
  email: z.string().trim().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginRequest = z.infer<typeof AdminLoginRequestSchema>;

export const AdminProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
});

export type AdminProfile = z.infer<typeof AdminProfileSchema>;

export const AdminLoginResponseSchema = z.object({
  token: z.string(),
  admin: AdminProfileSchema,
});

export type AdminLoginResponse = z.infer<typeof AdminLoginResponseSchema>;
