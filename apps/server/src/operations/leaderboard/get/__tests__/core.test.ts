import { describe, it, expect } from "vitest";
import { FailureCodes } from "@project/contracts";
import { getLeaderboardCore, type LeaderboardPort } from "../core.js";

function makePort(overrides: Partial<LeaderboardPort> = {}): LeaderboardPort {
  return {
    getExamLeaderboard: async () => ({
      exam: {
        id: "exam-1",
        title: "Algorithms Final",
        totalMarks: 100,
        examDate: "2026-12-01T00:00:00.000Z",
        status: "published",
      },
      records: [
        {
          rank: 1,
          registrationNumber: 1001,
          name: "Student A",
          batch: "2024",
          department: "CSE",
          obtainedMarks: 95,
          totalMarks: 100,
          percentage: 95,
        },
        {
          rank: 2,
          registrationNumber: 1002,
          name: "Student B",
          batch: "2024",
          department: "CSE",
          obtainedMarks: 90,
          totalMarks: 100,
          percentage: 90,
        },
      ],
      totalRecords: 2,
    }),
    ...overrides,
  };
}

describe("getLeaderboardCore", () => {
  it("returns NOT_FOUND if exam is not found", async () => {
    const port = makePort({ getExamLeaderboard: async () => null });
    const result = await getLeaderboardCore(port, null, {
      examId: "missing-exam",
      query: { page: 1, limit: 10 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(FailureCodes.NOT_FOUND);
      expect(result.message).toBe("Exam not found");
    }
  });

  it("returns formatted leaderboard with rankings and pagination", async () => {
    const port = makePort();
    const result = await getLeaderboardCore(port, null, {
      examId: "exam-1",
      query: { page: 1, limit: 10 },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.exam.title).toBe("Algorithms Final");
      expect(result.value.leaderboard).toHaveLength(2);
      expect(result.value.leaderboard[0].rank).toBe(1);
      expect(result.value.leaderboard[0].percentage).toBe(95);
      expect(result.value.pagination.totalRecords).toBe(2);
      expect(result.value.pagination.currentPage).toBe(1);
      expect(result.value.pagination.hasNextPage).toBe(false);
    }
  });
});
