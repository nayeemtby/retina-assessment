import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { getResultCore, type GetResultPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<GetResultPort> = {}): GetResultPort {
  return {
    findResultById: async (id: string) => ({
      id,
      studentId: "student-1",
      examId: "exam-1",
      obtainedMarks: 95,
      student: { name: "Alice" },
      exam: { title: "Midterm" },
    }),
    ...overrides,
  };
}

describe("getResultCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await getResultCore(port, null, { id: "res-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns NOT_FOUND if result is not found", async () => {
    const port = makePort({ findResultById: async () => null });
    const result = await getResultCore(port, mockCaller, { id: "missing" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Result not found");
    }
  });

  it("returns result when found", async () => {
    const port = makePort();
    const result = await getResultCore(port, mockCaller, { id: "res-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe("res-1");
      expect(result.value.obtainedMarks).toBe(95);
    }
  });
});
