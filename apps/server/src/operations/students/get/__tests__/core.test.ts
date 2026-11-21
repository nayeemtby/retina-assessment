import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { getStudentCore, type GetStudentPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<GetStudentPort> = {}): GetStudentPort {
  return {
    findStudentById: async (id: string) => ({
      id,
      registrationNumber: 1001,
      name: "Bob",
      email: "bob@example.com",
      batch: "2024",
      department: "CSE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe("getStudentCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await getStudentCore(port, null, { id: "student-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND when student does not exist", async () => {
    const port = makePort({ findStudentById: async () => null });
    const result = await getStudentCore(port, mockCaller, { id: "non-existent" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Student not found");
    }
  });

  it("returns student when found", async () => {
    const port = makePort();
    const result = await getStudentCore(port, mockCaller, { id: "student-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe("student-1");
      expect(result.value.name).toBe("Bob");
    }
  });
});
