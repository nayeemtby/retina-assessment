import mongoose from "mongoose";
import {
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Student } from "../../../models/Student.js";
import { Result } from "../../../models/Result.js";

export interface DeleteStudentInput {
  id: string;
}

export interface DeleteStudentPort {
  findStudentById(id: string): Promise<boolean>;
  countResultsByStudentId(studentId: string): Promise<number>;
  deleteStudentById(id: string): Promise<boolean>;
}

export function createStudentDeleteAdapter(): DeleteStudentPort {
  return {
    findStudentById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const exists = await Student.exists({ _id: id });
      return Boolean(exists);
    },
    countResultsByStudentId: async (studentId: string) => {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return 0;
      }
      return Result.countDocuments({ studentId });
    },
    deleteStudentById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const res = await Student.findByIdAndDelete(id);
      return Boolean(res);
    },
  };
}

export async function deleteStudentCore(
  port: DeleteStudentPort,
  caller: AdminProfile | null,
  input: DeleteStudentInput
): Promise<WireResult<{ id: string; deleted: true }>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const exists = await port.findStudentById(input.id);
  if (!exists) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Student not found",
    });
  }

  const resultCount = await port.countResultsByStudentId(input.id);
  if (resultCount > 0) {
    return wireError({
      code: FailureCodes.CONFLICT,
      message:
        "Cannot delete student: Student has existing exam results. Delete results first.",
    });
  }

  await port.deleteStudentById(input.id);
  return wireSuccess(
    { id: input.id, deleted: true },
    "Student deleted successfully"
  );
}
