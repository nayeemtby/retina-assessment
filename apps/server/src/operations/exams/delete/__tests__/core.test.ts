import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { deleteExamCore, type DeleteExamPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<DeleteExamPort> = {}): DeleteExamPort {
  return {
    findExamById: async () => true,
    countResultsByExamId: async () => 0,
    deleteExamById: async () => true,
    ...overrides,
  };
}

describe("deleteExamCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await deleteExamCore(port, null, { id: "exam-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND if exam does not exist", async () => {
    const port = makePort({ findExamById: async () => false });
    const result = await deleteExamCore(port, mockCaller, { id: "exam-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Exam not found");
    }
  });

  it("rejects with CONFLICT if exam has recorded results", async () => {
    const port = makePort({ countResultsByExamId: async () => 3 });
    const result = await deleteExamCore(port, mockCaller, { id: "exam-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.CONFLICT);
      expect(result.message).toContain("Examination has recorded student results");
    }
  });

  it("deletes exam successfully when no results exist", async () => {
    const port = makePort();
    const result = await deleteExamCore(port, mockCaller, { id: "exam-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ id: "exam-1", deleted: true });
      expect(result.message).toBe("Exam deleted successfully");
    }
  });
});
