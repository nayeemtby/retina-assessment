import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { updateStudentCore, type UpdateStudentPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<UpdateStudentPort> = {}): UpdateStudentPort {
  return {
    findConflict: async () => false,
    updateStudent: async (id, data) => ({
      id,
      registrationNumber: data.registrationNumber ?? 1001,
      name: data.name ?? "Updated Name",
      email: data.email ?? "updated@example.com",
      batch: data.batch ?? "2024",
      department: data.department ?? "CSE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe("updateStudentCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await updateStudentCore(port, null, {
      id: "student-1",
      data: { name: "New Name" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("rejects conflict with other students with CONFLICT", async () => {
    const port = makePort({ findConflict: async () => true });
    const result = await updateStudentCore(port, mockCaller, {
      id: "student-1",
      data: { registrationNumber: 1002 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.CONFLICT);
      expect(result.message).toContain("already in use by another student");
    }
  });

  it("returns NOT_FOUND if student does not exist", async () => {
    const port = makePort({ updateStudent: async () => null });
    const result = await updateStudentCore(port, mockCaller, {
      id: "student-1",
      data: { name: "New Name" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Student not found");
    }
  });

  it("updates student successfully", async () => {
    const port = makePort();
    const result = await updateStudentCore(port, mockCaller, {
      id: "student-1",
      data: { name: "Updated Name" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.name).toBe("Updated Name");
      expect(result.message).toBe("Student updated successfully");
    }
  });
});
