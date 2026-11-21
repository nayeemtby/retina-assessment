import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { createResultCore, type CreateResultPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<CreateResultPort> = {}): CreateResultPort {
  return {
    findStudentById: async () => true,
    findExamById: async () => ({ id: "exam-1", totalMarks: 100 }),
    findResultByStudentAndExam: async () => false,
    createResult: async (data) => ({
      id: "result-1",
      studentId: data.studentId,
      examId: data.examId,
      obtainedMarks: data.obtainedMarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe("createResultCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await createResultCore(port, null, {
      studentId: "student-1",
      examId: "exam-1",
      obtainedMarks: 85,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND if student does not exist", async () => {
    const port = makePort({ findStudentById: async () => false });
    const result = await createResultCore(port, mockCaller, {
      studentId: "nonexistent",
      examId: "exam-1",
      obtainedMarks: 85,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Student not found");
    }
  });

  it("returns NOT_FOUND if exam does not exist", async () => {
    const port = makePort({ findExamById: async () => null });
    const result = await createResultCore(port, mockCaller, {
      studentId: "student-1",
      examId: "nonexistent",
      obtainedMarks: 85,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Exam not found");
    }
  });

  it("rejects with BAD_REQUEST if obtainedMarks > totalMarks", async () => {
    const port = makePort({
      findExamById: async () => ({ id: "exam-1", totalMarks: 100 }),
    });
    const result = await createResultCore(port, mockCaller, {
      studentId: "student-1",
      examId: "exam-1",
      obtainedMarks: 105,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.BAD_REQUEST);
      expect(result.message).toContain("cannot exceed exam total marks (100)");
    }
  });

  it("rejects with CONFLICT if result already exists for student and exam", async () => {
    const port = makePort({ findResultByStudentAndExam: async () => true });
    const result = await createResultCore(port, mockCaller, {
      studentId: "student-1",
      examId: "exam-1",
      obtainedMarks: 90,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.CONFLICT);
      expect(result.message).toContain("already exists");
    }
  });

  it("creates result successfully and returns wireSuccess", async () => {
    const port = makePort();
    const result = await createResultCore(port, mockCaller, {
      studentId: "student-1",
      examId: "exam-1",
      obtainedMarks: 95,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.obtainedMarks).toBe(95);
      expect(result.message).toBe("Result recorded successfully");
    }
  });
});
