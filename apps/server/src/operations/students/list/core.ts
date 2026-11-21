import {
  type StudentQuery,
  type Student as StudentType,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Student } from "../../../models/Student.js";

export interface PaginatedStudents {
  items: StudentType[];
  pagination: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ListStudentsPort {
  listStudents(
    filter: { search?: string; department?: string; batch?: string },
    skip: number,
    limit: number
  ): Promise<{ items: StudentType[]; totalRecords: number }>;
}

export function createStudentListAdapter(): ListStudentsPort {
  return {
    listStudents: async (filterData, skip, limit) => {
      const filter: Record<string, any> = {};

      if (filterData.batch) {
        filter.batch = filterData.batch;
      }
      if (filterData.department) {
        filter.department = filterData.department;
      }
      if (filterData.search) {
        const searchNum = Number(filterData.search);
        if (!Number.isNaN(searchNum)) {
          filter.$or = [
            { registrationNumber: searchNum },
            { name: new RegExp(filterData.search, "i") },
          ];
        } else {
          filter.name = new RegExp(filterData.search, "i");
        }
      }

      const [docs, totalRecords] = await Promise.all([
        Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Student.countDocuments(filter),
      ]);

      return {
        items: docs.map((doc) => ({
          id: doc._id.toString(),
          registrationNumber: doc.registrationNumber,
          name: doc.name,
          email: doc.email,
          batch: doc.batch,
          department: doc.department,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        })),
        totalRecords,
      };
    },
  };
}

export async function listStudentsCore(
  port: ListStudentsPort,
  caller: AdminProfile | null,
  input: StudentQuery
): Promise<WireResult<PaginatedStudents>> {
  if (!caller) {
    return wireError({
      code: FailureCodes.UNAUTHORIZED,
      message: "Authentication token missing or invalid",
    });
  }

  const page = Math.max(1, input.page || 1);
  const limit = Math.max(1, Math.min(100, input.limit || 10));
  const skip = (page - 1) * limit;

  const { items, totalRecords } = await port.listStudents(
    {
      search: input.search,
      department: input.department,
      batch: input.batch,
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
