import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { listResultsCore, type ListResultsPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<ListResultsPort> = {}): ListResultsPort {
  return {
    listResults: async () => ({
      items: [
        {
          id: "result-1",
          studentId: "student-1",
          student: {
            id: "student-1",
            registrationNumber: 1001,
            name: "Alice",
            email: "alice@example.com",
            batch: "2024",
            department: "CSE",
          },
          examId: "exam-1",
          exam: {
            id: "exam-1",
            title: "Midterm",
            totalMarks: 100,
            status: "published",
          },
          obtainedMarks: 95,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalRecords: 1,
    }),
    ...overrides,
  };
}

describe("listResultsCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await listResultsCore(port, null, { page: 1, limit: 10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns paginated populated results list", async () => {
    const port = makePort();
    const result = await listResultsCore(port, mockCaller, { page: 1, limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.items).toHaveLength(1);
      expect(result.value.items[0].student.name).toBe("Alice");
      expect(result.value.pagination.totalRecords).toBe(1);
    }
  });
});
