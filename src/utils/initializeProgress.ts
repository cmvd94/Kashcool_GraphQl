/* import { Subject } from "../models/subject";
import { Unit } from "../models/unit";
import { Lesson } from "../models/lesson";
import { Progress } from "../models/ChildProgressPercentage/progressPercentage";
import { UnitProgress } from "../models/ChildProgressPercentage/unitProgress";
import { LessonProgress } from "../models/ChildProgressPercentage/lessonProgress";
import { Child } from "../models/child";
export const initializeProgress = async (
  childId: string,
  regionId: string,
  gradeId: string,
  semester: string
) => {
  try {
    //console.log("inside Initialize");

    // Check if a progress model already exists for this child, region, grade, and semester
    const existProgress = await Progress.findOne({
      childId: childId,
      regionId: regionId,
      gradeId: gradeId,
      semester: semester,
    });

    if (existProgress) {
      return existProgress._id;
    }
    //console.log("does not exists");

    // Step 1: Fetch all subjects for the region, grade, and semester
    const subjects = await Subject.find({
      region: regionId,
      gradeId: gradeId,
      semester,
    });

    if (!subjects || subjects.length === 0) {
      throw new Error(
        "No subjects found for the specified region, grade, and semester."
      );
    }

    // Initialize the progress structure for the child
    const subjectProgressArray = [];

    // Step 2: Loop through each subject
    for (const subject of subjects) {
      const units = await Unit.find({ subjectId: subject._id });
      //console.log("inside Loop:", units);

      // Initialize unit progress array
      const unitProgressArray = [];

      // Step 3: Loop through each unit
      for (const unit of units) {
        const lessons = await Lesson.find({ unitId: unit._id });
        //console.log("inside unit of units:", lessons);

        // Initialize lesson progress array
        const lessonProgressArray = [];

        // Step 4: Loop through each lesson and initialize chapter progress
        for (const lesson of lessons) {
          // Create lesson progress model
          const lessonProgress = new LessonProgress({
            unitProgressId: null, // Placeholder, will set later
            lessonId: lesson._id,
            childId: childId,
            progress: 0, // Initialize lesson progress percentage to 0
            chapters: lesson.chapter.map((chapter) => ({
              chapterNo: chapter.chapterNumber,
              progress: 0, // Initialize chapter progress to 0
              time: 0, // If video-based, initialize time to 0
            })),
          });
          // console.log(
          //   "inside lesson of lesson, create lesson progress:",
          //   lessonProgress
          // );

          // Save lesson progress
          await lessonProgress.save();

          // Add lesson progress to the array
          lessonProgressArray.push({
            lessonProgressId: lessonProgress._id,
            lessonId: lesson._id,
            progress: 0, // Initialize overall lesson progress to 0
          });
        }

        // Create unit progress model
        const unitProgress = new UnitProgress({
          progressId: null, // Placeholder, will set later
          unitId: unit._id,
          lessons: lessonProgressArray, // Assign lesson progress array
          progress: 0, // Initialize unit progress percentage to 0
        });

        // Save unit progress
        await unitProgress.save();

        // Now that the unit progress is saved, update the unitProgressId in each lessonProgress
        await Promise.all(
          lessonProgressArray.map(async (lessonProgress) => {
            await LessonProgress.findByIdAndUpdate(
              lessonProgress.lessonProgressId,
              {
                unitProgressId: unitProgress._id,
              }
            );
          })
        );

        // Add unit progress to the array
        unitProgressArray.push({
          unitProgressId: unitProgress._id,
          unitId: unit._id,
          progress: 0, // Initialize overall unit progress to 0
        });

        //console.log("lesson progress id pushed in unit");
      }

      // Add subject progress to the subject array
      subjectProgressArray.push({
        subjectId: subject._id,
        units: unitProgressArray, // Assign unit progress array
        progress: 0, // Initialize subject progress percentage to 0
      });
    }
    //console.log("unit progressArray is pushed in subject");

    // Step 5: Create the overall Progress model for the child
    const progress = new Progress({
      childId,
      regionId,
      gradeId,
      semester,
      subjects: subjectProgressArray,
    });

    // Save the progress model
    await progress.save();
    //console.log("progress model created");

    // Now that the progress is saved, update the progressId in each unitProgress
    await Promise.all(
      subjectProgressArray.map(async (subject) => {
        await Promise.all(
          subject.units.map(async (unitProgress) => {
            await UnitProgress.findByIdAndUpdate(unitProgress.unitProgressId, {
              progressId: progress._id,
            });
          })
        );
      })
    );

    // Step 6: Update child model with the new progress ID
    const child = await Child.findById(childId);
    if (!child) {
      throw new Error("Child not found");
    }

    // Add the progress ID to the child's progress array
    child.progress.push(progress._id);

    // Save the updated child
    await child.save();

    //console.log("progress id is pushed and id is returned");
    return progress._id;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error initializing progress: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred.");
    }
  }
}; */


import { Subject } from "../models/subject";
import { Unit } from "../models/unit";
import { Lesson } from "../models/lesson";
import { Progress, UnitInSubjectProgress } from "../models/ChildProgressPercentage/progressPercentage";
import { UnitProgress } from "../models/ChildProgressPercentage/unitProgress";
import { LessonProgress } from "../models/ChildProgressPercentage/lessonProgress";
import { Child } from "../models/child";
import { Chapter } from "../models/lesson";
import mongoose from "mongoose";
export const initializeProgress = async (
  childId: string,
  regionId: string,
  gradeId: string,
  semester: string
) => {
  try {

    // Check if a progress model already exists for this child, region, grade, and semester
    const existProgress = await Progress.findOne({
      childId: childId,
      regionId: regionId,
      gradeId: gradeId,
      semester: semester,
    });

    if (existProgress) {
      return existProgress._id;
    }
    console.log("inside initializeProgress");

    // Step 1: Fetch all subjects for the region, grade, and semester
    const subjects = await Subject.find({
      region: regionId,
      gradeId: gradeId,
      semester,
    });

    if (!subjects || subjects.length === 0) {
      throw new Error(
        "No subjects found for the specified region, grade, and semester."
      );
    }
    const progress = new Progress({
      childId,
      regionId,
      gradeId,
      semester,
      subjects: [],
    });
    await progress.save();
    //console.log("progress:", progress);

    const subjectArray = await Promise.all(
      subjects.map(async (sub) => {
        const unitArray = await Promise.all(
          sub.unit.map((unit) =>
            createUnitProgress(sub._id, unit.unitObjectId, progress._id)
          )
        );

        return { subjectId: sub._id, units: unitArray };
      })
    );

    //console.log(subjectArray);
    progress.subjects.push(...subjectArray);
    await progress.save();

    //console.log("subject Array", subjectArray);

    const child = await Child.findById(childId);
    if (!child) {
      throw new Error("Child not found");
    }

    // Add the progress ID to the child's progress array
    child.progress.push(progress._id);

    // Save the updated child
    await child.save();
    return progress._id;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error initializing progress: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred.");
    }
  }
};

export const createUnitProgress = async (
  subjectId: mongoose.Schema.Types.ObjectId,
  unitId: mongoose.Schema.Types.ObjectId,
  progressId: mongoose.Schema.Types.ObjectId
)  => {
  try {
    const unitProgress = new UnitProgress({
      unitId: unitId,
      progressId: progressId,
      lessons: [],
    });
    await unitProgress.save();
    
    const unit = await Unit.findById({ _id: unitId, subjectId: subjectId });
    if (!unit) {
      throw new Error(" unit not found");
    }

    const lessonArray = await Promise.all(
      unit?.lesson.map((les) => {
        const lessonProgress = createLessonProgress(
          unitProgress._id,
          les.lessonId,
          progressId
        );
        return lessonProgress;
      })
    );

    unitProgress.lessons.push(...lessonArray);
    await unitProgress.save();

    return {
      unitProgressId: unitProgress._id,
      unitId: unit._id,
      progressPercentage: 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error initializing progress: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred.");
    }
  }
};

export const createLessonProgress = async (
  unitProgressId: mongoose.Schema.Types.ObjectId,
  lessonId: mongoose.Schema.Types.ObjectId,
  progressId: mongoose.Schema.Types.ObjectId
) => {
  try {
    const progress = await Progress.findById(progressId);
    if (!progress) {
      throw new Error(" progress not found");
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error(" lesson not found");
    }

    const lessonProgress = new LessonProgress({
      childId: progress.childId,
      lessonId: lesson._id,
      unitProgressId: unitProgressId,
      chapters: [],
    });

    await lessonProgress.save();

    const chapterArray = await Promise.all(
      lesson.chapter.map((chpt) => {
        return createChapterProgress(chpt as Chapter);
      })
    );
    lessonProgress.chapters.push(...chapterArray);
    await lessonProgress.save();
    return {
      lessonProgressId: lessonProgress._id,
      lessonId: lessonId,
      progressPercentage: 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error initializing progress: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred.");
    }
  }
};

export const createChapterProgress = async (chapter: Chapter) => {
  return {
    chapterNo: +chapter.chapterNumber,
    chapterContent: chapter.chapterContent,
    progressPercentage: 0,
    timeSpent: null,
  };
};