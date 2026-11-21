import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { deleteStudentCore, type DeleteStudentPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<DeleteStudentPort> = {}): DeleteStudentPort {
  return {
    findStudentById: async () => true,
    countResultsByStudentId: async () => 0,
    deleteStudentById: async () => true,
    ...overrides,
  };
}

describe("deleteStudentCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await deleteStudentCore(port, null, { id: "student-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND if student does not exist", async () => {
    const port = makePort({ findStudentById: async () => false });
    const result = await deleteStudentCore(port, mockCaller, { id: "student-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Student not found");
    }
  });

  it("rejects with CONFLICT if student has existing exam results", async () => {
    const port = makePort({ countResultsByStudentId: async () => 2 });
    const result = await deleteStudentCore(port, mockCaller, { id: "student-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.CONFLICT);
      expect(result.message).toContain("Student has existing exam results");
    }
  });

  it("deletes student successfully when no results exist", async () => {
    const port = makePort();
    const result = await deleteStudentCore(port, mockCaller, { id: "student-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ id: "student-1", deleted: true });
      expect(result.message).toBe("Student deleted successfully");
    }
  });
});
