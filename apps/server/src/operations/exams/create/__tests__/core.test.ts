import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { createExamCore, type CreateExamPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<CreateExamPort> = {}): CreateExamPort {
  return {
    createExam: async (data) => ({
      id: "exam-1",
      title: data.title,
      examDate: "2026-12-01T00:00:00.000Z",
      totalMarks: data.totalMarks,
      status: data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe("createExamCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await createExamCore(port, null, {
      title: "Midterm Exam",
      examDate: "2026-12-01T00:00:00.000Z",
      totalMarks: 100,
      status: "draft",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("creates exam successfully and returns wireSuccess", async () => {
    const port = makePort();
    const result = await createExamCore(port, mockCaller, {
      title: "Algorithms Final",
      examDate: "2026-12-01T00:00:00.000Z",
      totalMarks: 100,
      status: "published",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.title).toBe("Algorithms Final");
      expect(result.value.totalMarks).toBe(100);
      expect(result.value.status).toBe("published");
      expect(result.message).toBe("Exam created successfully");
    }
  });
});
