import { z } from "zod";

export const ResultSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  examId: z.string(),
  obtainedMarks: z.number().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Result = z.infer<typeof ResultSchema>;

export const CreateResultSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
  examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid exam ID format"),
  obtainedMarks: z.coerce.number().min(0, "Obtained marks cannot be negative"),
});

export type CreateResultInput = z.infer<typeof CreateResultSchema>;

export const UpdateResultSchema = z.object({
  obtainedMarks: z.coerce.number().min(0, "Obtained marks cannot be negative"),
});

export type UpdateResultInput = z.infer<typeof UpdateResultSchema>;

export const ResultQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.string().optional(),
  examId: z.string().optional(),
});

export type ResultQuery = z.infer<typeof ResultQuerySchema>;
