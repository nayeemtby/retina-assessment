import { z } from "zod";

export const StudentSchema = z.object({
  id: z.string(),
  registrationNumber: z.number().int().positive(),
  name: z.string().trim().min(1),
  email: z.string().trim().email().toLowerCase(),
  batch: z.string().trim().min(1),
  department: z.string().trim().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Student = z.infer<typeof StudentSchema>;

export const CreateStudentSchema = z.object({
  registrationNumber: z.coerce
    .number()
    .int("Registration number must be an integer")
    .positive("Registration number must be a positive integer"),
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email format").toLowerCase(),
  batch: z.string().trim().min(1, "Batch is required"),
  department: z.string().trim().min(1, "Department is required"),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = CreateStudentSchema.partial();

export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;

export const StudentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  batch: z.string().trim().optional(),
});

export type StudentQuery = z.infer<typeof StudentQuerySchema>;
