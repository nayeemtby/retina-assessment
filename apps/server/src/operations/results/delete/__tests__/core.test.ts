import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { deleteResultCore, type DeleteResultPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<DeleteResultPort> = {}): DeleteResultPort {
  return {
    findResultById: async () => true,
    deleteResultById: async () => true,
    ...overrides,
  };
}

describe("deleteResultCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await deleteResultCore(port, null, { id: "res-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND if result does not exist", async () => {
    const port = makePort({ findResultById: async () => false });
    const result = await deleteResultCore(port, mockCaller, { id: "res-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Result not found");
    }
  });

  it("deletes result successfully", async () => {
    const port = makePort();
    const result = await deleteResultCore(port, mockCaller, { id: "res-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ id: "res-1", deleted: true });
      expect(result.message).toBe("Result deleted successfully");
    }
  });
});
