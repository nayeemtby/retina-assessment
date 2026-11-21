import { z } from "zod";

export const ExamStatusValues = ["draft", "published", "completed"] as const;
export const ExamStatusSchema = z.enum(ExamStatusValues);
export type ExamStatus = z.infer<typeof ExamStatusSchema>;

export const ExamSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1),
  examDate: z.string(),
  totalMarks: z.number().positive(),
  status: ExamStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Exam = z.infer<typeof ExamSchema>;

export const CreateExamSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  examDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Must be valid date format (YYYY-MM-DD)")),
  totalMarks: z.coerce.number().positive("Total marks must be greater than zero"),
  status: ExamStatusSchema.default("draft"),
});

export type CreateExamInput = z.infer<typeof CreateExamSchema>;

export const UpdateExamSchema = CreateExamSchema.partial();
export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;

export const ExamQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: ExamStatusSchema.optional(),
  search: z.string().trim().optional(),
});

export type ExamQuery = z.infer<typeof ExamQuerySchema>;
