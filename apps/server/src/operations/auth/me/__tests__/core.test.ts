import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { meCore } from "../core.js";

describe("meCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const result = await meCore(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns admin profile when caller is present", async () => {
    const caller: AdminProfile = {
      id: "admin-1",
      username: "admin",
      email: "admin@example.com",
    };
    const result = await meCore(caller);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(caller);
    }
  });
});
