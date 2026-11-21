import mongoose from "mongoose";
import {
  type UpdateExamInput,
  type Exam as ExamType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Exam } from "../../../models/Exam.js";
import { Result } from "../../../models/Result.js";

export interface UpdateExamRequest {
  id: string;
  data: UpdateExamInput;
}

export interface UpdateExamPort {
  findExamById(id: string): Promise<ExamType | null>;
  findMaxObtainedMarks(examId: string): Promise<number | null>;
  updateExam(id: string, data: UpdateExamInput): Promise<ExamType | null>;
}

export function createExamUpdateAdapter(): UpdateExamPort {
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
    findMaxObtainedMarks: async (examId: string) => {
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return null;
      }
      const topResult = await Result.findOne({
        examId: new mongoose.Types.ObjectId(examId),
      })
        .sort({ obtainedMarks: -1 })
        .select("obtainedMarks")
        .lean();
      return topResult ? topResult.obtainedMarks : null;
    },
    updateExam: async (id: string, data: UpdateExamInput) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const updateData: any = { ...data };
      if (data.examDate) {
        updateData.examDate = new Date(data.examDate);
      }
      const doc = await Exam.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
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

export async function updateExamCore(
  port: UpdateExamPort,
  caller: AdminProfile | null,
  input: UpdateExamRequest
): Promise<WireResult<ExamType>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const existing = await port.findExamById(input.id);
  if (!existing) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Exam not found",
    });
  }

  if (input.data.totalMarks !== undefined) {
    const maxMarks = await port.findMaxObtainedMarks(input.id);
    if (maxMarks !== null && maxMarks > input.data.totalMarks) {
      return wireError({
        code: FailureCodes.BAD_REQUEST,
        message: `Cannot reduce total marks below existing obtained marks (${maxMarks})`,
      });
    }
  }

  const updated = await port.updateExam(input.id, input.data);
  if (!updated) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Exam not found",
    });
  }

  return wireSuccess(updated, "Exam updated successfully");
}
