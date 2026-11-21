import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../../../db/connection.js";
import { Exam } from "../../../../models/Exam.js";
import { Student } from "../../../../models/Student.js";
import { Result } from "../../../../models/Result.js";
import { createLeaderboardGetAdapter } from "../core.js";

describe("MongoDB Leaderboard Aggregation Pipeline", () => {
  let examId: string;
  let studentIds: mongoose.Types.ObjectId[] = [];

  beforeAll(async () => {
    await connectDatabase();

    const exam = await Exam.create({
      title: "Integration Test Exam",
      examDate: new Date(),
      totalMarks: 100,
      status: "published",
    });
    examId = exam._id.toString();

    const s1 = await Student.create({
      registrationNumber: 888801,
      name: "Student One",
      email: "s1@test.com",
      batch: "2024",
      department: "CSE",
    });
    const s2 = await Student.create({
      registrationNumber: 888802,
      name: "Student Two",
      email: "s2@test.com",
      batch: "2024",
      department: "CSE",
    });
    studentIds = [s1._id as mongoose.Types.ObjectId, s2._id as mongoose.Types.ObjectId];

    await Result.create([
      { studentId: s1._id, examId: exam._id, obtainedMarks: 95 },
      { studentId: s2._id, examId: exam._id, obtainedMarks: 85 },
    ]);
  });

  afterAll(async () => {
    if (examId) {
      await Result.deleteMany({ examId });
      await Exam.findByIdAndDelete(examId);
    }
    if (studentIds.length > 0) {
      await Student.deleteMany({ _id: { $in: studentIds } });
    }
    await disconnectDatabase();
  });

  it("successfully executes $setWindowFields and returns ranked records without Location5371602 error", async () => {
    const adapter = createLeaderboardGetAdapter();
    const data = await adapter.getExamLeaderboard(examId, 0, 10);

    expect(data).not.toBeNull();
    expect(data!.totalRecords).toBe(2);
    expect(data!.records).toHaveLength(2);

    expect(data!.records[0].rank).toBe(1);
    expect(data!.records[0].registrationNumber).toBe(888801);
    expect(data!.records[0].obtainedMarks).toBe(95);
    expect(data!.records[0].percentage).toBe(95);

    expect(data!.records[1].rank).toBe(2);
    expect(data!.records[1].registrationNumber).toBe(888802);
    expect(data!.records[1].obtainedMarks).toBe(85);
    expect(data!.records[1].percentage).toBe(85);
  });
});
