import mongoose from "mongoose";
import {
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Exam } from "../../../models/Exam.js";
import { Result } from "../../../models/Result.js";

export interface DeleteExamInput {
  id: string;
}

export interface DeleteExamPort {
  findExamById(id: string): Promise<boolean>;
  countResultsByExamId(examId: string): Promise<number>;
  deleteExamById(id: string): Promise<boolean>;
}

export function createExamDeleteAdapter(): DeleteExamPort {
  return {
    findExamById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const exists = await Exam.exists({ _id: id });
      return Boolean(exists);
    },
    countResultsByExamId: async (examId: string) => {
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return 0;
      }
      return Result.countDocuments({ examId });
    },
    deleteExamById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const res = await Exam.findByIdAndDelete(id);
      return Boolean(res);
    },
  };
}

export async function deleteExamCore(
  port: DeleteExamPort,
  caller: AdminProfile | null,
  input: DeleteExamInput
): Promise<WireResult<{ id: string; deleted: true }>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const exists = await port.findExamById(input.id);
  if (!exists) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Exam not found",
    });
  }

  const resultCount = await port.countResultsByExamId(input.id);
  if (resultCount > 0) {
    return wireError({
      code: FailureCodes.CONFLICT,
      message:
        "Cannot delete exam: Examination has recorded student results. Delete results first.",
    });
  }

  await port.deleteExamById(input.id);
  return wireSuccess(
    { id: input.id, deleted: true },
    "Exam deleted successfully"
  );
}
