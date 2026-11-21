import {
  type CreateExamInput,
  type Exam as ExamType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Exam } from "../../../models/Exam.js";

export interface CreateExamPort {
  createExam(data: CreateExamInput): Promise<ExamType>;
}

export function createExamCreateAdapter(): CreateExamPort {
  return {
    createExam: async (data: CreateExamInput) => {
      const doc = await Exam.create({
        ...data,
        examDate: new Date(data.examDate),
      });
      return {
        id: doc._id.toString(),
        title: doc.title,
        examDate: doc.examDate.toISOString(),
        totalMarks: doc.totalMarks,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    },
  };
}

export async function createExamCore(
  port: CreateExamPort,
  caller: AdminProfile | null,
  input: CreateExamInput
): Promise<WireResult<ExamType>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const exam = await port.createExam(input);
  return wireSuccess(exam, "Exam created successfully");
}
