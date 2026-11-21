import mongoose from "mongoose";
import {
  type ResultQuery,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Result } from "../../../models/Result.js";

export interface PaginatedResults {
  items: any[];
  pagination: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ListResultsPort {
  listResults(
    filter: { studentId?: string; examId?: string },
    skip: number,
    limit: number
  ): Promise<{ items: any[]; totalRecords: number }>;
}

export function createResultListAdapter(): ListResultsPort {
  return {
    listResults: async (filterData, skip, limit) => {
      const filter: Record<string, any> = {};

      if (filterData.studentId) {
        if (mongoose.Types.ObjectId.isValid(filterData.studentId)) {
          filter.studentId = new mongoose.Types.ObjectId(filterData.studentId);
        } else {
          return { items: [], totalRecords: 0 };
        }
      }

      if (filterData.examId) {
        if (mongoose.Types.ObjectId.isValid(filterData.examId)) {
          filter.examId = new mongoose.Types.ObjectId(filterData.examId);
        } else {
          return { items: [], totalRecords: 0 };
        }
      }

      const [docs, totalRecords] = await Promise.all([
        Result.find(filter)
          .populate(
            "studentId",
            "registrationNumber name email batch department"
          )
          .populate("examId", "title totalMarks status")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Result.countDocuments(filter),
      ]);

      const items = docs.map((doc: any) => ({
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
      }));

      return {
        items,
        totalRecords,
      };
    },
  };
}

export async function listResultsCore(
  port: ListResultsPort,
  caller: AdminProfile | null,
  input: ResultQuery
): Promise<WireResult<PaginatedResults>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const page = Math.max(1, input.page || 1);
  const limit = Math.max(1, Math.min(100, input.limit || 10));
  const skip = (page - 1) * limit;

  const { items, totalRecords } = await port.listResults(
    {
      studentId: input.studentId,
      examId: input.examId,
    },
    skip,
    limit
  );

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return wireSuccess({
    items,
    pagination: {
      currentPage: page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}
