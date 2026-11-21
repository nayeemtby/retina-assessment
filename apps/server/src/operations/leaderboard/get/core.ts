import mongoose from "mongoose";
import {
  type LeaderboardQuery,
  type LeaderboardResponse,
  type LeaderboardEntry,
  type AdminProfile,
  type WireResult,
  wireSuccess,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { Exam } from "../../../models/Exam.js";
import { Result } from "../../../models/Result.js";

export interface ExamLeaderboardData {
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    examDate: string;
    status: string;
  };
  records: LeaderboardEntry[];
  totalRecords: number;
}

export interface LeaderboardPort {
  getExamLeaderboard(
    examId: string,
    skip: number,
    limit: number
  ): Promise<ExamLeaderboardData | null>;
}

export function createLeaderboardGetAdapter(): LeaderboardPort {
  return {
    getExamLeaderboard: async (
      examIdString: string,
      skip: number,
      limit: number
    ) => {
      if (!mongoose.Types.ObjectId.isValid(examIdString)) {
        return null;
      }
      const examId = new mongoose.Types.ObjectId(examIdString);
      const exam = await Exam.findById(examId).lean();
      if (!exam) {
        return null;
      }

      const pipeline: mongoose.PipelineStage[] = [
        {
          $match: { examId: examId },
        },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: "$student",
        },
        {
          $sort: {
            obtainedMarks: -1,
            "student.registrationNumber": 1,
          },
        },
        {
          $setWindowFields: {
            sortBy: {
              obtainedMarks: -1,
              "student.registrationNumber": 1,
            },
            output: {
              rank: { $documentNumber: {} },
            },
          },
        },
        {
          $project: {
            _id: 1,
            rank: 1,
            registrationNumber: "$student.registrationNumber",
            name: "$student.name",
            batch: "$student.batch",
            department: "$student.department",
            obtainedMarks: 1,
            totalMarks: { $literal: exam.totalMarks },
            percentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$obtainedMarks", exam.totalMarks] },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        {
          $facet: {
            metadata: [{ $count: "totalRecords" }],
            records: [{ $skip: skip }, { $limit: limit }],
          },
        },
      ];

      const [aggResult] = await Result.aggregate(pipeline);
      const totalRecords = aggResult?.metadata?.[0]?.totalRecords || 0;
      const records: LeaderboardEntry[] = (aggResult?.records || []).map(
        (r: any) => ({
          rank: r.rank,
          registrationNumber: r.registrationNumber,
          name: r.name,
          batch: r.batch,
          department: r.department,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
        })
      );

      return {
        exam: {
          id: exam._id.toString(),
          title: exam.title,
          totalMarks: exam.totalMarks,
          examDate:
            exam.examDate instanceof Date
              ? exam.examDate.toISOString()
              : String(exam.examDate),
          status: exam.status,
        },
        records,
        totalRecords,
      };
    },
  };
}

export async function getLeaderboardCore(
  port: LeaderboardPort,
  caller: AdminProfile | null,
  input: { examId: string; query: LeaderboardQuery }
): Promise<WireResult<LeaderboardResponse>> {
  const page = Math.max(1, input.query.page || 1);
  const limit = Math.max(1, Math.min(100, input.query.limit || 10));
  const skip = (page - 1) * limit;

  const data = await port.getExamLeaderboard(input.examId, skip, limit);
  if (!data) {
    return wireError({
      code: FailureCodes.NOT_FOUND,
      message: "Exam not found",
    });
  }

  const totalPages = Math.ceil(data.totalRecords / limit) || 1;

  return wireSuccess({
    exam: data.exam,
    leaderboard: data.records,
    pagination: {
      currentPage: page,
      limit,
      totalRecords: data.totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}
