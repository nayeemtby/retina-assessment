import {
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";

export type MePort = Record<string, never>;

export function createMeAdapter(): MePort {
  return {};
}

export async function meCore(
  caller: AdminProfile | null
): Promise<WireResult<AdminProfile>>;
export async function meCore(
  port: MePort,
  caller: AdminProfile | null
): Promise<WireResult<AdminProfile>>;
export async function meCore(
  arg1: MePort | AdminProfile | null,
  arg2?: AdminProfile | null
): Promise<WireResult<AdminProfile>> {
  const caller = (arg2 !== undefined ? arg2 : arg1) as AdminProfile | null;
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  return wireSuccess(caller);
}
