import mongoose, { Schema, Document } from "mongoose";

export interface ChapterProgress {
  chapterNo: number;
  chapterContent: String
  progressPercentage: number;
  timeSpent?: number | null; // Optional: Time spent, in case it's a video lesson
}

export interface LessonProgressDocument extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  childId: mongoose.Schema.Types.ObjectId;
  lessonId: mongoose.Schema.Types.ObjectId;
  unitProgressId: mongoose.Schema.Types.ObjectId; // Link to UnitProgress
  chapters: ChapterProgress[];
  updatedAt: Date;
}


const LessonProgressSchema: Schema = new Schema(
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
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    unitProgressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UnitProgress",
    },
    chapters: [
      {
        chapterNo: { type: Number, required: true },
        chapterContent: { type: String, require: true},
        progressPercentage: { type: Number, default: 0 },
        timeSpent: { type: Number, default: null }, // Optional field for video lessons Stored in seconds
      },
    ],
  },
  { timestamps: true }
);

export const LessonProgress = mongoose.model<LessonProgressDocument>(
  "LessonProgress",
  LessonProgressSchema
);
