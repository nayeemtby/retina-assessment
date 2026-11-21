import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { updateExamCore, type UpdateExamPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<UpdateExamPort> = {}): UpdateExamPort {
  return {
    findExamById: async (id: string) => ({
      id,
      title: "Midterm Exam",
      examDate: "2026-11-20T00:00:00.000Z",
      totalMarks: 100,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    findMaxObtainedMarks: async () => null,
    updateExam: async (id, data) => ({
      id,
      title: data.title ?? "Midterm Exam",
      examDate: data.examDate ?? "2026-11-20T00:00:00.000Z",
      totalMarks: data.totalMarks ?? 100,
      status: data.status ?? "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe("updateExamCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await updateExamCore(port, null, {
      id: "exam-1",
      data: { title: "Updated" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND if exam does not exist", async () => {
    const port = makePort({ findExamById: async () => null });
    const result = await updateExamCore(port, mockCaller, {
      id: "missing",
      data: { title: "Updated" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Exam not found");
    }
  });

  it("rejects totalMarks reduction below existing max obtainedMarks with BAD_REQUEST", async () => {
    const port = makePort({ findMaxObtainedMarks: async () => 85 });
    const result = await updateExamCore(port, mockCaller, {
      id: "exam-1",
      data: { totalMarks: 80 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.BAD_REQUEST);
      expect(result.message).toContain("Cannot reduce total marks below existing obtained marks (85)");
    }
  });

  it("updates exam successfully when validation passes", async () => {
    const port = makePort({ findMaxObtainedMarks: async () => 70 });
    const result = await updateExamCore(port, mockCaller, {
      id: "exam-1",
      data: { totalMarks: 80, title: "New Title" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.totalMarks).toBe(80);
      expect(result.value.title).toBe("New Title");
      expect(result.message).toBe("Exam updated successfully");
    }
  });
});
