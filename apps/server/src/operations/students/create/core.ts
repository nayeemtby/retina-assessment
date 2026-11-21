import {
  type CreateStudentInput,
  type Student as StudentType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Student } from "../../../models/Student.js";

export interface CreateStudentPort {
  findConflict(
    regNum: number,
    email: string
  ): Promise<{ registrationNumber: number; email: string } | null>;
  createStudent(data: CreateStudentInput): Promise<StudentType>;
}

export function createStudentCreateAdapter(): CreateStudentPort {
  return {
    findConflict: async (regNum: number, email: string) => {
      const existing = await Student.findOne({
        $or: [{ registrationNumber: regNum }, { email: email.toLowerCase() }],
      })
        .select("registrationNumber email")
        .lean();
      if (!existing) return null;
      return {
        registrationNumber: existing.registrationNumber,
        email: existing.email,
      };
    },
    createStudent: async (data: CreateStudentInput) => {
      const doc = await Student.create(data);
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

export async function createStudentCore(
  port: CreateStudentPort,
  caller: AdminProfile | null,
  input: CreateStudentInput
): Promise<WireResult<StudentType>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const conflict = await port.findConflict(
    input.registrationNumber,
    input.email
  );
  if (conflict) {
    const field =
      conflict.registrationNumber === input.registrationNumber
        ? "Registration number"
        : "Email";
    return wireError({
      code: FailureCodes.CONFLICT,
      message: `${field} is already in use`,
    });
  }

  const student = await port.createStudent(input);
  return wireSuccess(student, "Student created successfully");
}
