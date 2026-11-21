import mongoose from "mongoose";
import {
  type Exam as ExamType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Exam } from "../../../models/Exam.js";

export interface GetExamInput {
  id: string;
}

export interface GetExamPort {
  findExamById(id: string): Promise<ExamType | null>;
}

export function createExamGetAdapter(): GetExamPort {
  return {
    findExamById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const doc = await Exam.findById(id).lean();
      if (!doc) return null;
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

export async function getExamCore(
  port: GetExamPort,
  caller: AdminProfile | null,
  input: GetExamInput
): Promise<WireResult<ExamType>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const exam = await port.findExamById(input.id);
  if (!exam) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Exam not found",
    });
  }

  return wireSuccess(exam);
}
