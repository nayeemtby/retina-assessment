import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { listExamsCore, type ListExamsPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<ListExamsPort> = {}): ListExamsPort {
  return {
    listExams: async () => ({
      items: [
        {
          id: "exam-1",
          title: "Midterm",
          examDate: "2026-11-20T00:00:00.000Z",
          totalMarks: 100,
          status: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalRecords: 1,
    }),
    ...overrides,
  };
}

describe("listExamsCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await listExamsCore(port, null, { page: 1, limit: 10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns paginated exams list", async () => {
    const port = makePort();
    const result = await listExamsCore(port, mockCaller, { page: 1, limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.items).toHaveLength(1);
      expect(result.value.pagination.totalRecords).toBe(1);
      expect(result.value.pagination.currentPage).toBe(1);
      expect(result.value.pagination.totalPages).toBe(1);
    }
  });
});
