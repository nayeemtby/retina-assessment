import { describe, it, expect } from "vitest";
import { FailureCodes } from "@project/contracts";
import { loginCore, type LoginPort } from "../core.js";

function makePort(overrides: Partial<LoginPort> = {}): LoginPort {
  return {
    findAdminByEmail: async (email: string) => ({
      id: "admin-1",
      username: "admin",
      email,
      passwordHash: "hash-secret",
    }),
    comparePassword: async (candidate: string, hash: string) =>
      candidate === "correct-pwd" && hash === "hash-secret",
    issueToken: () => "mock-jwt-token",
    ...overrides,
  };
}

describe("loginCore", () => {
  it("rejects non-existent email with UNAUTHORIZED", async () => {
    const port = makePort({ findAdminByEmail: async () => null });
    const result = await loginCore(port, null, {
      email: "unknown@example.com",
      password: "pass",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("rejects incorrect password with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await loginCore(port, null, {
      email: "admin@example.com",
      password: "wrong-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns token and profile on successful login", async () => {
    const port = makePort();
    const result = await loginCore(port, null, {
      email: "admin@example.com",
      password: "correct-pwd",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.token).toBe("mock-jwt-token");
      expect(result.value.admin).toEqual({
        id: "admin-1",
        username: "admin",
        email: "admin@example.com",
      });
    }
  });
});
