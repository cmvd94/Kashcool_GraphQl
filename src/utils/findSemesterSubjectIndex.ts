import mongoose from "mongoose";
import { Grade } from "../models/grade"; // Adjust the import path accordingly
/**
 * A function to fetch the selected semester and other semester names based on the provided semesterName.
 * If no semesterName is provided, the first semester is used by default.
 *
 * @param gradeId - The grade ID from which semesters are fetched.
 * @param semesterName - The semester name to find. If not provided, the first semester is used.
 * @returns An object containing the selected semester and other semester names.
 * @throws Will throw an error if no semesters are found or if the specified semester is not found.
 */

export interface SemesterResponse {
  semesterName: string;
  subjects: any[]; // Adjust this type according to your Subject schema
}
export interface SemesterAndOthersResponse {
  selectedSemester: SemesterResponse;
  otherSemesters: string[];
}
export const findSemesterAndOthers = async (
  gradeId: mongoose.Schema.Types.ObjectId,
  semesterName?: string
): Promise<SemesterAndOthersResponse> => {
  const grade = await Grade.findById(gradeId);
  if (!grade) {
    throw new Error("Grade not found.");
  }

  if (!grade.semesters || grade.semesters.length === 0) {
    throw new Error("No semesters found in the grade.");
  }

  let selectedSemester;
  if (!semesterName) {
    selectedSemester = grade.semesters[0]; // Default to the first semester
  } else {
    selectedSemester = grade.semesters.find(
      (sem) => sem.semesterName === semesterName
    );

    if (!selectedSemester) {
      throw new Error(
        `Semester "${semesterName}" not found in the grade "${grade.grade}".`
      );
    }
  }

  const otherSemesters = grade.semesters
    .filter((sem) => sem.semesterName !== selectedSemester.semesterName)
    .map((sem) => sem.semesterName);

  return {
    selectedSemester,
    otherSemesters,
  };
};
