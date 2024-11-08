import mongoose from "mongoose";
import { Child } from "../../models/child";
import {
  Progress,
  UnitInSubjectProgress,
} from "../../models/ChildProgressPercentage/progressPercentage";
import { Subject, UnitSub } from "../../models/subject";
import {
  deleteSubjectProgress,
  deleteUnitProgress,
  deleteLessonProgress,
} from "./userDeleteHelper";
import {
  UnitProgress,
  LessonInUnitProgress,
} from "../../models/ChildProgressPercentage/unitProgress";
import { Unit } from "../../models/unit";
import { LessonProgress } from "../../models/ChildProgressPercentage/lessonProgress";
import { Lesson } from "../../models/lesson";
import {
  createUnitProgress,
  createLessonProgress,
  createChapterProgress,
} from "../initializeProgress";

export const updateProgressStructure = async (
  regionId: mongoose.Schema.Types.ObjectId,
  parentId: mongoose.Schema.Types.ObjectId,
  childId: mongoose.Schema.Types.ObjectId,
  gradeId: mongoose.Schema.Types.ObjectId,
  semesterName: string
) => {
  try {
    console.log("inside update Structure");
    const child = await Child.findOne({ _id: childId, parent: parentId });
    if (!child) {
      throw new Error("Child not Found");
    }

    const existingProgress = await Progress.findOne({
      childId: childId,
      gradeId: gradeId,
      semester: semesterName,
    });
    if (!existingProgress) {
      throw new Error("Progress not found");
    }

    const newSubjects = await Subject.find({
      region: regionId,
      gradeId: gradeId,
      semester: semesterName,
    });

    // checking subjectId
    // Step 1: Create hash maps for faster lookups
    const newSubjectMap = new Map(
      newSubjects.map((sub) => [sub._id.toString(), sub])
    );

    // Step 2: Filter out unavailable subjects from existingProgress.subjects
    existingProgress.subjects = await Promise.all(
      existingProgress.subjects.map(async (subject) => {
        const matchingSubject = newSubjectMap.get(subject.subjectId.toString());

        if (matchingSubject) {
          // Perform unit checks
          await unitCheck(
            matchingSubject._id,
            subject.units,
            matchingSubject.unit,
            existingProgress._id
          );
          return subject;
        } else {
          // Delete subject progress if no match in newSubjects
          await deleteSubjectProgress(subject);
          return null; // Mark for filtering out
        }
      })
    ).then((subjects) => subjects.filter((subject) => subject !== null)); // Remove nulls

    // Step 3: Identify and add missing subjects in `existingProgress`
    const existingSubjectIds = new Set(
      existingProgress.subjects.map((subject) => subject.subjectId.toString())
    );

    for (let subject of newSubjects) {
      if (!existingSubjectIds.has(subject._id.toString())) {
        // Batch create unit progress entries for the new subject's units
        const unitArray = await Promise.all(
          subject.unit.map((u) =>
            createUnitProgress(
              subject._id,
              u.unitObjectId,
              existingProgress._id
            )
          )
        );

        existingProgress.subjects.push({
          subjectId: subject._id,
          units: unitArray,
        });
      }
    }

    // Save the updated existingProgress document after modifications
    await existingProgress.save();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error update progress: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred.");
    }
  }
};

// checking unitId
export const unitCheck = async (
  subjectId: mongoose.Schema.Types.ObjectId,
  progressSubjectUnit: UnitInSubjectProgress[],
  subjectUnit: UnitSub[],
  progressId: mongoose.Schema.Types.ObjectId
) => {
  if (!progressSubjectUnit && !subjectUnit) {
    throw new Error("Progress or Subject Id Undefined");
  }

  // Create a set of unit IDs in progress for quick lookup
  const progressUnitIds = new Set(
    progressSubjectUnit.map((unit) => unit.unitId.toString())
  );

  // Loop through each unit in subjectUnit
  for (let u of subjectUnit) {
    const unitExistsInProgress = progressUnitIds.has(u.unitObjectId.toString());

    if (unitExistsInProgress) {
      // If unit exists, check its lessons
      const progressUnit = progressSubjectUnit.find(
        (unit) => unit.unitId.toString() === u.unitObjectId.toString()
      );
      if (progressUnit) {
        await lessonCheck(
          subjectId,
          progressUnit.unitProgressId,
          u.unitObjectId,
          progressId
        );
      }
    } else {
      // If unit does not exist, add it
      await createUnitProgress(subjectId, u.unitObjectId, progressId);
    }
  }

  // Remove any units in progress that are no longer in subjectUnit
  for (let unit of progressSubjectUnit) {
    const available = subjectUnit.some(
      (u) => u.unitObjectId.toString() === unit.unitId.toString()
    );
    if (!available) {
      await deleteUnitProgress(
        unit.unitProgressId.toString(),
        subjectId.toString()
      );
    }
  }
};

export const lessonCheck = async (
  subjectId: mongoose.Schema.Types.ObjectId,
  unitProgressId: mongoose.Schema.Types.ObjectId,
  unitId: mongoose.Schema.Types.ObjectId,
  progressId: mongoose.Schema.Types.ObjectId
) => {
  const existUnitProgress = await UnitProgress.findOne({
    _id: unitProgressId,
    unitId: unitId,
  });
  const newUnit = await Unit.findOne({ _id: unitId, subjectId: subjectId });

  if (!existUnitProgress || !newUnit) {
    throw new Error("UnitProgress or Unit not found");
  }

  // Set of existing lesson IDs for quick lookup
  const existingLessonIds = new Set(
    existUnitProgress.lessons.map((lesson) => lesson.lessonId.toString())
  );

  // Loop through lessons in newUnit to verify against existUnitProgress
  for (let lesson of newUnit.lesson) {
    const lessonExistsInProgress = existingLessonIds.has(
      lesson.lessonId.toString()
    );

    if (lessonExistsInProgress) {
      // Call chapterCheck if lesson exists in progress
      const progressLesson = existUnitProgress.lessons.find(
        (l) => l.lessonId.toString() === lesson.lessonId.toString()
      );
      if (progressLesson) {
        await chapterCheck(newUnit._id, progressLesson);
      }
    } else {
      // Add new lesson to progress if it doesn’t exist
      await createLessonProgress(unitProgressId, lesson.lessonId, progressId);
    }
  }

  // Remove any outdated lessons in existUnitProgress
  for (let lesson of existUnitProgress.lessons) {
    const available = newUnit.lesson.some(
      (newLesson) =>
        newLesson.lessonId.toString() === lesson.lessonId.toString()
    );
    if (!available) {
      await deleteLessonProgress(lesson.lessonProgressId.toString());
    }
  }
};

export const chapterCheck = async (
  unitId: mongoose.Schema.Types.ObjectId,
  lessonObj: LessonInUnitProgress
) => {
  const existingLessonProgress = await LessonProgress.findOne({
    _id: lessonObj.lessonProgressId,
    lessonId: lessonObj.lessonId,
  });

  const newLesson = await Lesson.findOne({
    _id: lessonObj.lessonId,
    unitId: unitId,
  });

  if (!existingLessonProgress || !newLesson) {
    throw new Error("ExistingLessonProgress or NewLesson document is missing");
  }

  // If there's an update in the Lesson model
  if (existingLessonProgress?.updatedAt < newLesson?.updatedAt) {
    // Create a Set of existing chapter identifiers for quick lookup
    const existingChaptersSet = new Set(
      existingLessonProgress.chapters.map(
        (chapter) => `${chapter.chapterContent}-${chapter.chapterNo}`
      )
    );

    // Process each chapter in the new lesson
    for (let newChapter of newLesson.chapter) {
      const chapterId = `${newChapter.chapterContent}-${newChapter.chapterNumber}`;

      if (!existingChaptersSet.has(chapterId)) {
        // If the new chapter is not in existing progress, add it
        const newChapterProgress = await createChapterProgress(newChapter);
        existingLessonProgress.chapters.push(newChapterProgress);
      }
    }

    // Update existingLessonProgress to delete any chapters not in newLesson
    existingLessonProgress.chapters = existingLessonProgress.chapters.filter(
      (chapter) =>
        newLesson.chapter.some(
          (newCh) =>
            newCh.chapterContent === chapter.chapterContent &&
            +newCh.chapterNumber === chapter.chapterNo
        )
    );

    await existingLessonProgress.save();
  }
};
