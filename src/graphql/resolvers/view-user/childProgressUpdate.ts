import { LessonProgress } from "../../../models/ChildProgressPercentage/lessonProgress";
import { UnitProgress } from "../../../models/ChildProgressPercentage/unitProgress";
import { Progress } from "../../../models/ChildProgressPercentage/progressPercentage";
import { childProgressUpdateInput } from "../../../types/userInput";

export const childProgressResolver = {
  Mutation: {
    updateLessonProgress: async (
      _: any,
      { input }: { input: childProgressUpdateInput }
    ) => {
      try {
        const {
          lessonProgressId,
          childId,
          chapterNumber,
          progressPercentage,
          timeWatched,
        } = input;
        // Step 1: Find the lesson progress by ID
        const lessonProgress = await LessonProgress.findById(lessonProgressId);
        if (!lessonProgress) {
          throw new Error("Lesson progress not found");
        }

        if (lessonProgress.childId.toString() !== childId) {
          throw new Error("This chapter Progress not belong to this child");
        }
        // Step 2: Update the specific chapter progress within the lesson
        const chapterToUpdate = lessonProgress.chapters.find(
          (chapter) => chapter.chapterNo === chapterNumber
        );

        if (!chapterToUpdate) {
          throw new Error("Chapter not found in the lesson");
        }

        // Update the progress and time watched for the chapter
        chapterToUpdate.progressPercentage = progressPercentage;
        chapterToUpdate.timeSpent = timeWatched || chapterToUpdate.timeSpent;

        // Save the updated lesson progress
        await lessonProgress.save();

        // Step 3: Recalculate overall lesson progress
        const totalChapters = lessonProgress.chapters.length;
        const totalProgress = lessonProgress.chapters.reduce(
          (sum, chapter) => sum + chapter.progressPercentage,
          0
        );
        const newLessonProgress = totalProgress / totalChapters;

        await lessonProgress.save();

        // Step 4: Update unit progress by recalculating the lesson progress within the unit
        const unitProgress = await UnitProgress.findById(
          lessonProgress.unitProgressId
        );
        if (!unitProgress) {
          throw new Error("Unit progress not found");
        }

        // Find the lesson inside the unit's lessons array and update its progress
        const lessonInUnit = unitProgress.lessons.find(
          (lesson) => lesson.lessonProgressId.toString() === lessonProgressId
        );

        if (lessonInUnit) {
          lessonInUnit.progressPercentage = newLessonProgress;
          await unitProgress.save();
        } else {
          throw new Error("Lesson not found in unit progress");
        }

        // Step 5: Recalculate overall unit progress (average of all lessons)
        const totalLessons = unitProgress.lessons.length;
        const totalUnitProgress = unitProgress.lessons.reduce(
          (sum, lesson) => sum + lesson.progressPercentage,
          0
        );
        const newUnitProgress = totalUnitProgress / totalLessons;

        await unitProgress.save();

        // Step 6: Update subject progress (within the Progress model)
        const progressData = await Progress.findOne({
          "subjects.units.unitProgressId": unitProgress._id,
        });
        if (!progressData) {
          throw new Error("Progress data not found");
        }

        // Find the unit inside the subject's units array and update its progress
        let unitInSubject;
        progressData.subjects.forEach((subject) => {
          unitInSubject = subject.units.find(
            (unit) =>
              unit.unitProgressId.toString() === unitProgress._id.toString()
          );
          if (unitInSubject) {
            unitInSubject.progressPercentage = newUnitProgress;
          }
        });

        // Save updated progress for the subject and units
        await progressData.save();

        return {
          success: true,
          message: "Lesson progress updated successfully",
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error updating progress: ${err.message}`);
        }
        throw new Error("Unknown error occurred");
        // return {
        //   success: false,
        //   message: `Error updating progress: ${error.message}`,
        // };
      }
    },
  },
};
