import mongoose, { Schema, Document } from "mongoose";

export interface UnitInSubjectProgress {
  unitProgressId: mongoose.Schema.Types.ObjectId;
  unitId: mongoose.Schema.Types.ObjectId;
  progressPercentage: number;
}

export interface SubjectProgress {
  subjectId: mongoose.Schema.Types.ObjectId;
  units: UnitInSubjectProgress[];
}

export interface ProgressDocument extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  childId: mongoose.Schema.Types.ObjectId;
  regionId: mongoose.Schema.Types.ObjectId;
  gradeId: mongoose.Schema.Types.ObjectId;
  semester: string;
  subjects: SubjectProgress[];
  updatedAt: Date;
}

const ProgressSchema: Schema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true, // Auto-generate the _id
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    regionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    semester: { type: String, required: true },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        units: [
          {
            unitProgressId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "UnitProgress",
              required: true,
            },
            unitId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Unit",
              required: true,
            },
            progressPercentage: { type: Number, default: 0 },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const Progress = mongoose.model<ProgressDocument>(
  "Progress",
  ProgressSchema
);
