import {
  type ExamQuery,
  type Exam as ExamType,
  type ExamStatus,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Exam } from "../../../models/Exam.js";

export interface PaginatedExams {
  items: ExamType[];
  pagination: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ListExamsPort {
  listExams(
    filter: { status?: ExamStatus; search?: string },
    skip: number,
    limit: number
  ): Promise<{ items: ExamType[]; totalRecords: number }>;
}

export function createExamListAdapter(): ListExamsPort {
  return {
    listExams: async (filterData, skip, limit) => {
      const filter: Record<string, any> = {};

      if (filterData.status) {
        filter.status = filterData.status;
      }
      if (filterData.search) {
        filter.title = new RegExp(filterData.search, "i");
      }

      const [docs, totalRecords] = await Promise.all([
        Exam.find(filter).sort({ examDate: -1 }).skip(skip).limit(limit),
        Exam.countDocuments(filter),
      ]);

      return {
        items: docs.map((doc) => ({
          id: doc._id.toString(),
          title: doc.title,
          examDate: doc.examDate.toISOString(),
          totalMarks: doc.totalMarks,
          status: doc.status,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        })),
        totalRecords,
      };
    },
  };
}

export async function listExamsCore(
  port: ListExamsPort,
  caller: AdminProfile | null,
  input: ExamQuery
): Promise<WireResult<PaginatedExams>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const page = Math.max(1, input.page || 1);
  const limit = Math.max(1, Math.min(100, input.limit || 10));
  const skip = (page - 1) * limit;

  const { items, totalRecords } = await port.listExams(
    {
      status: input.status,
      search: input.search,
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
