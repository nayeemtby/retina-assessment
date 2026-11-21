import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { getExamCore, type GetExamPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<GetExamPort> = {}): GetExamPort {
  return {
    findExamById: async (id: string) => ({
      id,
      title: "Final Exam",
      examDate: "2026-12-01T00:00:00.000Z",
      totalMarks: 100,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe("getExamCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await getExamCore(port, null, { id: "exam-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND when exam is not found", async () => {
    const port = makePort({ findExamById: async () => null });
    const result = await getExamCore(port, mockCaller, { id: "missing" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Exam not found");
    }
  });

  it("returns exam when found", async () => {
    const port = makePort();
    const result = await getExamCore(port, mockCaller, { id: "exam-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe("exam-1");
      expect(result.value.title).toBe("Final Exam");
    }
  });
});
