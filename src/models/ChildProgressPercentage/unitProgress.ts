import mongoose, { Schema, Document } from "mongoose";

export interface LessonInUnitProgress {
  lessonProgressId: mongoose.Schema.Types.ObjectId;
  lessonId: mongoose.Schema.Types.ObjectId;
  progressPercentage: number;
}

export interface UnitProgressDocument extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  unitId: mongoose.Schema.Types.ObjectId;
  progressId: mongoose.Schema.Types.ObjectId; // Link to Progress model
  lessons: LessonInUnitProgress[];
  updatedAt: Date;
}

const UnitProgressSchema: Schema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true, // Auto-generate the _id
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    progressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Progress",
    },
    
    lessons: [
      {
        lessonProgressId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LessonProgress",
          required: true,
        },
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lesson",
          required: true,
        },
        progressPercentage: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);
export const UnitProgress = mongoose.model<UnitProgressDocument>(
  "UnitProgress",
  UnitProgressSchema
);
