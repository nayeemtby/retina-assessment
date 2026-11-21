import mongoose from "mongoose";
import {
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Result } from "../../../models/Result.js";

export interface DeleteResultInput {
  id: string;
}

export interface DeleteResultPort {
  findResultById(id: string): Promise<boolean>;
  deleteResultById(id: string): Promise<boolean>;
}

export function createResultDeleteAdapter(): DeleteResultPort {
  return {
    findResultById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const exists = await Result.exists({ _id: id });
      return Boolean(exists);
    },
    deleteResultById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const res = await Result.findByIdAndDelete(id);
      return Boolean(res);
    },
  };
}

export async function deleteResultCore(
  port: DeleteResultPort,
  caller: AdminProfile | null,
  input: DeleteResultInput
): Promise<WireResult<{ id: string; deleted: true }>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const exists = await port.findResultById(input.id);
  if (!exists) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Result not found",
    });
  }

  await port.deleteResultById(input.id);
  return wireSuccess(
    { id: input.id, deleted: true },
    "Result deleted successfully"
  );
}
