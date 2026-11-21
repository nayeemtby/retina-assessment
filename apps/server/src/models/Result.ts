import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IResult extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  obtainedMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

ResultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export const Result: Model<IResult> =
  mongoose.models.Result || mongoose.model<IResult>("Result", ResultSchema);
