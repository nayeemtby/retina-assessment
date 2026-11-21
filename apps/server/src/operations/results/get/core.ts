import mongoose from "mongoose";
import {
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Result } from "../../../models/Result.js";

export interface GetResultInput {
  id: string;
}

export interface GetResultPort {
  findResultById(id: string): Promise<any | null>;
}

export function createResultGetAdapter(): GetResultPort {
  return {
    findResultById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const doc: any = await Result.findById(id)
        .populate("studentId", "registrationNumber name email batch department")
        .populate("examId", "title totalMarks status")
        .lean();
      if (!doc) return null;

      return {
        id: doc._id.toString(),
        studentId: doc.studentId?._id?.toString() || doc.studentId?.toString(),
        student: doc.studentId?._id
          ? {
              id: doc.studentId._id.toString(),
              registrationNumber: doc.studentId.registrationNumber,
              name: doc.studentId.name,
              email: doc.studentId.email,
              batch: doc.studentId.batch,
              department: doc.studentId.department,
            }
          : null,
        examId: doc.examId?._id?.toString() || doc.examId?.toString(),
        exam: doc.examId?._id
          ? {
              id: doc.examId._id.toString(),
              title: doc.examId.title,
              totalMarks: doc.examId.totalMarks,
              status: doc.examId.status,
            }
          : null,
        obtainedMarks: doc.obtainedMarks,
        createdAt:
          doc.createdAt instanceof Date
            ? doc.createdAt.toISOString()
            : String(doc.createdAt),
        updatedAt:
          doc.updatedAt instanceof Date
            ? doc.updatedAt.toISOString()
            : String(doc.updatedAt),
      };
    },
  };
}

export async function getResultCore(
  port: GetResultPort,
  caller: AdminProfile | null,
  input: GetResultInput
): Promise<WireResult<any>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const result = await port.findResultById(input.id);
  if (!result) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Result not found",
    });
  }

  return wireSuccess(result);
}
