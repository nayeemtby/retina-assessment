import mongoose from "mongoose";
import {
  type UpdateResultInput,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Result } from "../../../models/Result.js";
import { Exam } from "../../../models/Exam.js";

export interface UpdateResultRequest {
  id: string;
  data: UpdateResultInput;
}

export interface UpdateResultPort {
  findResultById(
    id: string
  ): Promise<{ id: string; examId: string; obtainedMarks: number } | null>;
  findExamTotalMarks(examId: string): Promise<number | null>;
  updateResult(id: string, obtainedMarks: number): Promise<any | null>;
}

export function createResultUpdateAdapter(): UpdateResultPort {
  return {
    findResultById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const doc = await Result.findById(id)
        .select("_id examId obtainedMarks")
        .lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        examId: doc.examId.toString(),
        obtainedMarks: doc.obtainedMarks,
      };
    },
    findExamTotalMarks: async (examId: string) => {
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return null;
      }
      const doc = await Exam.findById(examId).select("totalMarks").lean();
      return doc ? doc.totalMarks : null;
    },
    updateResult: async (id: string, obtainedMarks: number) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const doc: any = await Result.findByIdAndUpdate(
        id,
        { $set: { obtainedMarks } },
        { new: true, runValidators: true }
      )
        .populate(
          "studentId",
          "registrationNumber name email batch department"
        )
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

export async function updateResultCore(
  port: UpdateResultPort,
  caller: AdminProfile | null,
  input: UpdateResultRequest
): Promise<WireResult<any>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const existing = await port.findResultById(input.id);
  if (!existing) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Result not found",
    });
  }

  const totalMarks = await port.findExamTotalMarks(existing.examId);
  if (totalMarks === null) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Associated exam not found",
    });
  }

  if (input.data.obtainedMarks > totalMarks) {
    return wireError({
      code: FailureCodes.BAD_REQUEST,
      message: `Obtained marks (${input.data.obtainedMarks}) cannot exceed exam total marks (${totalMarks})`,
    });
  }

  const updated = await port.updateResult(input.id, input.data.obtainedMarks);
  if (!updated) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Result not found",
    });
  }

  return wireSuccess(updated, "Result updated successfully");
}
