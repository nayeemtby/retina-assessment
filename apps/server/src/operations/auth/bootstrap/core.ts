import bcrypt from "bcryptjs";
import {
  type AdminBootstrapRequest,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Admin } from "../../../models/Admin.js";

export interface BootstrapPort {
  countAdmins(): Promise<number>;
  hashPassword(password: string): Promise<string>;
  createAdmin(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<AdminProfile>;
}

export function createBootstrapAdapter(): BootstrapPort {
  return {
    countAdmins: () => Admin.countDocuments(),
    hashPassword: (password: string) => bcrypt.hash(password, 10),
    createAdmin: async (data) => {
      const admin = await Admin.create(data);
      return {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
      };
    },
  };
}

export async function bootstrapCore(
  port: BootstrapPort,
  caller: AdminProfile | null,
  input: AdminBootstrapRequest
): Promise<WireResult<AdminProfile>>;
export async function bootstrapCore(
  port: BootstrapPort,
  input: AdminBootstrapRequest
): Promise<WireResult<AdminProfile>>;
export async function bootstrapCore(
  port: BootstrapPort,
  arg2: AdminProfile | null | AdminBootstrapRequest,
  arg3?: AdminBootstrapRequest
): Promise<WireResult<AdminProfile>> {
  const input = (arg3 ?? arg2) as AdminBootstrapRequest;
  const existingCount = await port.countAdmins();
  if (existingCount > 0) {
    return wireError({
      code: FailureCodes.CONFLICT,
      message: "Admin already initialized. Please log in.",
    });
  }

  const passwordHash = await port.hashPassword(input.password);
  const admin = await port.createAdmin({
    username: input.username,
    email: input.email,
    passwordHash,
  });

  return wireSuccess(admin, "Admin initialized successfully");
}
