import { describe, it, expect } from "vitest";
import { FailureCodes, type AdminProfile } from "@project/contracts";
import { listStudentsCore, type ListStudentsPort } from "../core.js";

const mockCaller: AdminProfile = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
};

function makePort(overrides: Partial<ListStudentsPort> = {}): ListStudentsPort {
  return {
    listStudents: async () => ({
      items: [
        {
          id: "student-1",
          registrationNumber: 1001,
          name: "Alice",
          email: "alice@example.com",
          batch: "2024",
          department: "CSE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalRecords: 1,
    }),
    ...overrides,
  };
}

describe("listStudentsCore", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    const port = makePort();
    const result = await listStudentsCore(port, null, { page: 1, limit: 10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.UNAUTHORIZED);
    }
  });

  it("returns paginated student list", async () => {
    const port = makePort();
    const result = await listStudentsCore(port, mockCaller, { page: 1, limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.items).toHaveLength(1);
      expect(result.value.pagination.totalRecords).toBe(1);
      expect(result.value.pagination.currentPage).toBe(1);
      expect(result.value.pagination.hasNextPage).toBe(false);
      expect(result.value.pagination.hasPrevPage).toBe(false);
    }
  });
});
