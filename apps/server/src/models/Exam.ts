import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ExamStatus } from "@project/contracts";

export interface IExam extends Document {
  title: string;
  examDate: Date;
  totalMarks: number;
  status: ExamStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    examDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "completed"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);
