import mongoose from "mongoose";

import { Parent } from "../../models/parent"; // Import Parent model
import { Child } from "../../models/child"; // Import Child model
import { Progress } from "../../models/ChildProgressPercentage/progressPercentage"; // Import Progress model
import { UnitProgress } from "../../models/ChildProgressPercentage/unitProgress"; // Import UnitProgress model
import { LessonProgress } from "../../models/ChildProgressPercentage/lessonProgress";
import { deleteS3Object } from "../deleteS3Object";
import { SubjectProgress } from "../../models/ChildProgressPercentage/progressPercentage";
import { UnitInSubjectProgress } from "../../models/ChildProgressPercentage/progressPercentage";

// Delete Parent helper function
export const deleteParent = async (parentId: string) => {
  try {
    // Find all children associated with the parent
    const children = await Child.find({ parent: parentId });

    // Loop through each child and delete them along with their associated progress
    for (const child of children) {
      await deleteChild(child._id.toString());
    }

    // Finally, delete the parent
    await Parent.findByIdAndDelete(parentId);

    console.log("Parent and all related data deleted successfully.");
  } catch (error) {
    console.error("Error deleting parent:", error);
  }
};

// Delete Child helper function
export const deleteChild = async (childId: string) => {
  try {
    // Find the child to get the parent ID
    const child = await Child.findById(childId).exec();
    if (!child) throw new Error("Child not found");

    const parent = await Parent.findById(child.parent).exec();
    if (!parent) throw new Error("Parent not found");

    // If the child is the defaultChild, update the defaultChild field
    if (parent.defaultChild!.toString() === childId.toString()) {
      const otherChildren = parent.children.filter(
        (c) => c.toString() !== childId.toString()
      );
      parent.defaultChild = otherChildren.length ? otherChildren[0] : null;
      await parent.save();
    }

    // Remove the child reference from the parent's children array
    await Parent.updateOne(
      { _id: child.parent },
      { $pull: { children: childId } }
    ).exec();

    // If child has an image, delete it from S3
    if (child.childrenImage) {
      await deleteS3Object(child.childrenImage); // Assuming deleteS3Object is properly implemented
    }

    // Delete all related progress records for the child
    const progressList = await Progress.find({ childId }).exec();
    for (const progress of progressList) {
      await deleteProgress(progress._id.toString()); // SubjectId is passed now
    }

    // Finally, delete the child itself
    await Child.findByIdAndDelete(childId).exec();

    console.log("Child and related data deleted successfully");
  } catch (error) {
    console.error("Error deleting child:", error);
  }
};
/* 
// Delete Progress helper function
export const deleteProgress = async (progressId: string) => {
  try {
    // Find the progress document using progressId
    const progress = await Progress.findById(progressId).exec();
    if (!progress) throw new Error("Progress not found");

    // Loop through each subject in the progress.subject array
    for (const subject of progress.subjects) {
      const { subjectId, units } = subject; // Get the subjectId and unit progress array

      // Delete each UnitProgress in this subject
      for (const unitProgress of units) {
        await deleteUnitProgress(
          unitProgress.unitProgressId.toString(),
          subjectId.toString()
        ); // Pass the unitProgressId and subjectId
      }
    }

    // Remove the progress from the child’s record
    await Child.updateOne(
      { _id: progress.childId },
      { $pull: { progress: progressId } }
    ).exec();

    // Finally, delete the progress itself
    await Progress.findByIdAndDelete(progressId).exec();

    console.log("Progress and all related data deleted successfully");
  } catch (error) {
    console.error("Error deleting progress:", error);
  }
};
 */

export const deleteProgress = async (progressId: string) => {
  try {
    // Find the progress document using progressId
    const progress = await Progress.findById(progressId).exec();
    if (!progress) throw new Error("Progress not found");

    // Loop through each subject in the progress.subject array
    for (const subject of progress.subjects) {
      deleteSubjectProgress(subject as SubjectProgress);
    }

    // Remove the progress from the child’s record
    await Child.updateOne(
      { _id: progress.childId },
      { $pull: { progress: progressId } }
    ).exec();

    // Finally, delete the progress itself
    await Progress.findByIdAndDelete(progressId).exec();

    console.log("Progress and all related data deleted successfully");
  } catch (error) {
    console.error("Error deleting progress:", error);
  }
};
// Delete Subject helper
export const deleteSubjectProgress = async (subject: SubjectProgress) => {
  try {
    const { subjectId, units } = subject;
    // Delete each UnitProgress in this subject
    for (const unitProgress of units) {
      await deleteUnitProgress(
        unitProgress.unitProgressId.toString(),
        subjectId.toString()
      ); // Pass the unitProgressId and subjectId
    }
  } catch (error) {
    console.error("Error deleting progress:", error);
  }
};

// Delete Unit Progress helper function
export const deleteUnitProgress = async (
  unitProgressId: string,
  subjectId: string
) => {
  try {
    const unitProgress = await UnitProgress.findById(unitProgressId).exec();
    // Remove the entire object containing the unitProgressId from the subjects array
    await Progress.updateOne(
      { _id: unitProgress?.progressId, "subjects.subjectId": subjectId }, // Find the correct subject
      { $pull: { "subjects.$.units": { unitProgressId } } } // Pull the unit object with the matching unitProgressId
    ).exec();
    if (unitProgress) {
      for (const lessonProgress of unitProgress.lessons) {
        await deleteLessonProgress(lessonProgress.lessonProgressId.toString()); // Delete all related lesson progress
      }
    }

    // Finally, delete the unit progress itself
    await UnitProgress.findByIdAndDelete(unitProgressId).exec();

    console.log(
      "Unit progress and related lesson progress deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting unit progress:", error);
  }
};

// Delete Lesson Progress helper function
export const deleteLessonProgress = async (lessonProgressId: string) => {
  try {
    const lessonProgress = await LessonProgress.findById(lessonProgressId);
    // Find the unit progress containing the lesson and remove it from the lessons array
    await UnitProgress.updateOne(
      { _id: lessonProgress?.unitProgressId },
      { $pull: { lessons: { lessonProgressId: lessonProgressId } } }
    ).exec();

    // Finally, delete the lesson progress itself
    await lessonProgress?.deleteOne();

    console.log("Lesson progress deleted successfully");
  } catch (error) {
    console.error("Error deleting lesson progress:", error);
  }
};
