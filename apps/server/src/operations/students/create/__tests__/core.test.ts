import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile, type Student } from "@project/contracts";
import { createStudentCore, type CreateStudentPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<CreateStudentPort> = {}): CreateStudentPort {
  return {
    findConflict: async () => null,
    createStudent: async (data) => ({
      id: "student-1",
      registrationNumber: data.registrationNumber,
      name: data.name,
      email: data.email,
      batch: data.batch,
      department: data.department,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe("createStudentCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await createStudentCore(port, null, {
      registrationNumber: 1001,
      name: "John Doe",
      email: "john@example.com",
      batch: "2024",
      department: "CSE",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("rejects duplicate registrationNumber with CONFLICT", async () => {
    const port = makePort({
      findConflict: async () => ({
        registrationNumber: 1001,
        email: "other@example.com",
      }),
    });

    const result = await createStudentCore(port, mockCaller, {
      registrationNumber: 1001,
      name: "John Doe",
      email: "john@example.com",
      batch: "2024",
      department: "CSE",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.CONFLICT);
      expect(result.message).toContain("Registration number is already in use");
    }
  });

  it("rejects duplicate email with CONFLICT", async () => {
    const port = makePort({
      findConflict: async () => ({
        registrationNumber: 9999,
        email: "john@example.com",
      }),
    });

    const result = await createStudentCore(port, mockCaller, {
      registrationNumber: 1001,
      name: "John Doe",
      email: "john@example.com",
      batch: "2024",
      department: "CSE",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.CONFLICT);
      expect(result.message).toContain("Email is already in use");
    }
  });

  it("creates student successfully and returns wireSuccess", async () => {
    const port = makePort();
    const result = await createStudentCore(port, mockCaller, {
      registrationNumber: 1001,
      name: "John Doe",
      email: "john@example.com",
      batch: "2024",
      department: "CSE",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.registrationNumber).toBe(1001);
      expect(result.value.name).toBe("John Doe");
      expect(result.message).toBe("Student created successfully");
    }
  });
});
