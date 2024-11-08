import mongoose from "mongoose";

// types/userInput.ts
export type RegisterUserInput = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  gender?: string;
  region?: string;
  dateOfBirth?: string;
};

export type VerifyOTPInput = {
  otp?: string;
  otpKey?: string;
};

export interface ChangePasswordInput {
  otp?: string;
  phone?: string;
  currentPassword?: string;
  newPassword: string;
}

export interface AddChildInput {
  name: string;
  gender: string;
  schoolName: string;
  dateOfBirth: string; // or Date if you want to handle Date objects directly
  grade: mongoose.Schema.Types.ObjectId;
  semester: string;
}

export interface childProgressUpdateInput {
  lessonProgressId: string;
  childId: string;
  chapterNumber: number;
  progressPercentage: number;
  timeWatched: number;
}
