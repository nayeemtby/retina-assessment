import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IStudent extends Document {
  registrationNumber: number;
  name: string;
  email: string;
  batch: string;
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    registrationNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "Registration number must be a positive integer",
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
