import { z } from "zod";

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  registrationNumber: z.number().int().positive(),
  name: z.string(),
  batch: z.string(),
  department: z.string(),
  obtainedMarks: z.number().min(0),
  totalMarks: z.number().positive(),
  percentage: z.number().min(0).max(100),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardPaginationSchema = z.object({
  currentPage: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalRecords: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export type LeaderboardPagination = z.infer<typeof LeaderboardPaginationSchema>;

export const LeaderboardResponseSchema = z.object({
  exam: z.object({
    id: z.string(),
    title: z.string(),
    totalMarks: z.number().positive(),
    examDate: z.string(),
    status: z.string(),
  }),
  leaderboard: z.array(LeaderboardEntrySchema),
  pagination: LeaderboardPaginationSchema,
});

export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export const LeaderboardParamsSchema = z.object({
  examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid exam ID format"),
});

export type LeaderboardParams = z.infer<typeof LeaderboardParamsSchema>;

export const LeaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
