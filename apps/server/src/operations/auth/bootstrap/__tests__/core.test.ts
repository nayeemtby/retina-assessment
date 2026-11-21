import { describe, it, expect } from "vitest";
import { FailureCodes } from "@project/contracts";
import { bootstrapCore, type BootstrapPort } from "../core.js";

function makePort(overrides: Partial<BootstrapPort> = {}): BootstrapPort {
  return {
    countAdmins: async () => 0,
    hashPassword: async (pwd: string) => `hashed_${pwd}`,
    createAdmin: async (data) => ({
      id: "admin-123",
      username: data.username,
      email: data.email,
    }),
    ...overrides,
  };
}

describe("bootstrapCore", () => {
  it("rejects when admin is already initialized with CONFLICT", async () => {
    const port = makePort({ countAdmins: async () => 1 });
    const result = await bootstrapCore(port, null, {
      username: "admin",
      email: "admin@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.CONFLICT);
      expect(result.message).toContain("Admin already initialized");
    }
  });

  it("hashes password and returns created admin profile when count is 0", async () => {
    const port = makePort();
    const result = await bootstrapCore(port, null, {
      username: "admin",
      email: "admin@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        id: "admin-123",
        username: "admin",
        email: "admin@example.com",
      });
      expect(result.message).toBe("Admin initialized successfully");
    }
  });
});
