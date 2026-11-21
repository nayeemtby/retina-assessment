import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { updateResultCore, type UpdateResultPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<UpdateResultPort> = {}): UpdateResultPort {
  return {
    findResultById: async (id: string) => ({
      id,
      examId: "exam-1",
      obtainedMarks: 80,
    }),
    findExamTotalMarks: async () => 100,
    updateResult: async (id, marks) => ({
      id,
      obtainedMarks: marks,
    }),
    ...overrides,
  };
}

describe("updateResultCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await updateResultCore(port, null, {
      id: "res-1",
      data: { obtainedMarks: 90 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND if result not found", async () => {
    const port = makePort({ findResultById: async () => null });
    const result = await updateResultCore(port, mockCaller, {
      id: "missing",
      data: { obtainedMarks: 90 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Result not found");
    }
  });

  it("returns NOT_FOUND if associated exam not found", async () => {
    const port = makePort({ findExamTotalMarks: async () => null });
    const result = await updateResultCore(port, mockCaller, {
      id: "res-1",
      data: { obtainedMarks: 90 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Associated exam not found");
    }
  });

  it("rejects with BAD_REQUEST if obtainedMarks > exam.totalMarks", async () => {
    const port = makePort({ findExamTotalMarks: async () => 100 });
    const result = await updateResultCore(port, mockCaller, {
      id: "res-1",
      data: { obtainedMarks: 110 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.BAD_REQUEST);
      expect(result.message).toContain("cannot exceed exam total marks (100)");
    }
  });

  it("updates result successfully when marks are valid", async () => {
    const port = makePort();
    const result = await updateResultCore(port, mockCaller, {
      id: "res-1",
      data: { obtainedMarks: 92 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.obtainedMarks).toBe(92);
      expect(result.message).toBe("Result updated successfully");
    }
  });
});
