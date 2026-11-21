import mongoose from "mongoose";
import {
  type Student as StudentType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Student } from "../../../models/Student.js";

export interface GetStudentInput {
  id: string;
}

export interface GetStudentPort {
  findStudentById(id: string): Promise<StudentType | null>;
}

export function createStudentGetAdapter(): GetStudentPort {
  return {
    findStudentById: async (id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const doc = await Student.findById(id).lean();
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

export async function getStudentCore(
  port: GetStudentPort,
  caller: AdminProfile | null,
  input: GetStudentInput
): Promise<WireResult<StudentType>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const student = await port.findStudentById(input.id);
  if (!student) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Student not found",
    });
  }

  return wireSuccess(student);
}
