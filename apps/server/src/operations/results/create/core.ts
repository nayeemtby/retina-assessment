import mongoose from "mongoose";
import {
  type CreateResultInput,
  type Result as ResultType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Result } from "../../../models/Result.js";
import { Student } from "../../../models/Student.js";
import { Exam } from "../../../models/Exam.js";

export interface CreateResultPort {
  findStudentById(studentId: string): Promise<boolean>;
  findExamById(
    examId: string
  ): Promise<{ id: string; totalMarks: number } | null>;
  findResultByStudentAndExam(
    studentId: string,
    examId: string
  ): Promise<boolean>;
  createResult(data: CreateResultInput): Promise<ResultType>;
}

export function createResultCreateAdapter(): CreateResultPort {
  return {
    findStudentById: async (studentId: string) => {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return false;
      }
      const exists = await Student.exists({ _id: studentId });
      return Boolean(exists);
    },
    findExamById: async (examId: string) => {
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return null;
      }
      const doc = await Exam.findById(examId).select("_id totalMarks").lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        totalMarks: doc.totalMarks,
      };
    },
    findResultByStudentAndExam: async (studentId: string, examId: string) => {
      if (
        !mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(examId)
      ) {
        return false;
      }
      const exists = await Result.exists({
        studentId: new mongoose.Types.ObjectId(studentId),
        examId: new mongoose.Types.ObjectId(examId),
      });
      return Boolean(exists);
    },
    createResult: async (data: CreateResultInput) => {
      const doc = await Result.create({
        studentId: new mongoose.Types.ObjectId(data.studentId),
        examId: new mongoose.Types.ObjectId(data.examId),
        obtainedMarks: data.obtainedMarks,
      });
      return {
        id: doc._id.toString(),
        studentId: doc.studentId.toString(),
        examId: doc.examId.toString(),
        obtainedMarks: doc.obtainedMarks,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    },
  };
}

export async function createResultCore(
  port: CreateResultPort,
  caller: AdminProfile | null,
  input: CreateResultInput
): Promise<WireResult<ResultType>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const studentExists = await port.findStudentById(input.studentId);
  if (!studentExists) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Student not found",
    });
  }

  const exam = await port.findExamById(input.examId);
  if (!exam) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Exam not found",
    });
  }

  if (input.obtainedMarks > exam.totalMarks) {
    return wireError({
      code: FailureCodes.BAD_REQUEST,
      message: `Obtained marks (${input.obtainedMarks}) cannot exceed exam total marks (${exam.totalMarks})`,
    });
  }

  const duplicateExists = await port.findResultByStudentAndExam(
    input.studentId,
    input.examId
  );
  if (duplicateExists) {
    return wireError({
      code: FailureCodes.CONFLICT,
      message: "A result for this student and exam already exists",
    });
  }

  const result = await port.createResult(input);
  return wireSuccess(result, "Result recorded successfully");
}
