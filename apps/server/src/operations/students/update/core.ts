import mongoose from "mongoose";
import {
  type UpdateStudentInput,
  type Student as StudentType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Student } from "../../../models/Student.js";

export interface UpdateStudentRequest {
  id: string;
  data: UpdateStudentInput;
}

export interface UpdateStudentPort {
  findConflict(id: string, regNum?: number, email?: string): Promise<boolean>;
  updateStudent(
    id: string,
    data: UpdateStudentInput
  ): Promise<StudentType | null>;
}

export function createStudentUpdateAdapter(): UpdateStudentPort {
  return {
    findConflict: async (id: string, regNum?: number, email?: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const orConditions: any[] = [];
      if (regNum !== undefined) {
        orConditions.push({ registrationNumber: regNum });
      }
      if (email !== undefined) {
        orConditions.push({ email: email.toLowerCase() });
      }
      if (orConditions.length === 0) return false;

      const conflicts = await Student.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        $or: orConditions,
      }).lean();

      return Boolean(conflicts);
    },
    updateStudent: async (id: string, data: UpdateStudentInput) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const doc = await Student.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        registrationNumber: doc.registrationNumber,
        name: doc.name,
        email: doc.email,
        batch: doc.batch,
        department: doc.department,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    },
  };
}

export async function updateStudentCore(
  port: UpdateStudentPort,
  caller: AdminProfile | null,
  input: UpdateStudentRequest
): Promise<WireResult<StudentType>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  if (
    input.data.registrationNumber !== undefined ||
    input.data.email !== undefined
  ) {
    const hasConflict = await port.findConflict(
      input.id,
      input.data.registrationNumber,
      input.data.email
    );
    if (hasConflict) {
      return wireError({
        code: FailureCodes.CONFLICT,
        message:
          "Registration number or email already in use by another student",
      });
    }
  }

  const updated = await port.updateStudent(input.id, input.data);
  if (!updated) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Student not found",
    });
  }

  return wireSuccess(updated, "Student updated successfully");
}
