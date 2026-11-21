import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  type AdminLoginRequest,
  type AdminLoginResponse,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Admin } from "../../../models/Admin.js";
import { env } from "../../../config/env.js";

export interface LoginPort {
  findAdminByEmail(
    email: string
  ): Promise<{
    id: string;
    username: string;
    email: string;
    passwordHash: string;
  } | null>;
  comparePassword(candidate: string, hash: string): Promise<boolean>;
  issueToken(profile: AdminProfile): string;
}

export function createLoginAdapter(): LoginPort {
  return {
    findAdminByEmail: async (email: string) => {
      const admin = await Admin.findOne({ email });
      if (!admin) return null;
      return {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        passwordHash: admin.passwordHash,
      };
    },
    comparePassword: (candidate: string, hash: string) =>
      bcrypt.compare(candidate, hash),
    issueToken: (profile: AdminProfile) =>
      jwt.sign(profile, env.JWT_SECRET, { expiresIn: "24h" }),
  };
}

export async function loginCore(
  port: LoginPort,
  caller: AdminProfile | null,
  input: AdminLoginRequest
): Promise<WireResult<AdminLoginResponse>>;
export async function loginCore(
  port: LoginPort,
  input: AdminLoginRequest
): Promise<WireResult<AdminLoginResponse>>;
export async function loginCore(
  port: LoginPort,
  arg2: AdminProfile | null | AdminLoginRequest,
  arg3?: AdminLoginRequest
): Promise<WireResult<AdminLoginResponse>> {
  const input = (arg3 ?? arg2) as AdminLoginRequest;
  const admin = await port.findAdminByEmail(input.email);
  if (!admin) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  }

  const isMatch = await port.comparePassword(input.password, admin.passwordHash);
  if (!isMatch) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  }

  const profile: AdminProfile = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
  };

  const token = port.issueToken(profile);

  return wireSuccess({
    token,
    admin: profile,
  });
}
