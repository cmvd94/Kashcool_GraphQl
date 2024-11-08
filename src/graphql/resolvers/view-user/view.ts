// Both Subscribed and Un-Subscribed user
// In index page if gradeId is set then parent unsub and also dont have child. frontend checks and req all grade then forwards this req
import mongoose from "mongoose";

import { Parent } from "../../../models/parent";
import { Child } from "../../../models/child";
import { Subject } from "../../../models/subject";
import { Unit } from "../../../models/unit";
import { Lesson } from "../../../models/lesson";
import { Progress } from "../../../models/ChildProgressPercentage/progressPercentage";
import { UnitProgress } from "../../../models/ChildProgressPercentage/unitProgress";
import { LessonProgress } from "../../../models/ChildProgressPercentage/lessonProgress";
import { MyContext } from "../../apollo";
import { generateSignedUrl } from "../../../utils/generateSignedUrl";
import { unsubscribedUnitPage } from "../../../utils/view-user/unsubscribedUnitPage";
import { findSemesterAndOthers } from "../../../utils/findSemesterSubjectIndex";
import { UpdateAdminDataEntryLog } from "../../../models/adminDataUpdateLog";
import { updateProgressStructure } from "../../../utils/view-user/updateProgress";

export const clientViewResolver = {
  Query: {
    // Index Page
    indexPageUser: async (
      _: any,
      {
        gradeId,
        childId,
        semesterName,
      }: { gradeId?: string; childId?: string; semesterName?: string },
      { req }: MyContext
    ) => {
      try {
        console.log("indexPage");
        let sem;
        if (!req.user || !req.user.region) {
          throw new Error("User is not authenticated");
        }

        const parent = await Parent.findById(req.user.id);
        if (!parent) {
          throw new Error("Parent not found");
        }

        // If parent has no children and no default child, they are in demo mode
        const isDemoAccount =
          !parent.defaultChild && parent.children.length === 0;

        // Case 1: Parent is in demo mode
        if (isDemoAccount) {
          if (!gradeId) {
            throw new Error("Grade is required for demo accounts");
          }

          // If no semester is provided, default to the first semester
          sem = await findSemesterAndOthers(
            new mongoose.Schema.Types.ObjectId(gradeId),
            semesterName
          );
        } else {
          // Case 2: Parent has children or a default child
          let childToUse = null;

          if (childId) {
            // If childId is provided, use it
            childToUse = childId;
          } else {
            // If no childId but defaultChild exists, use defaultChild
            childToUse = parent.defaultChild;
          }

          const child = await Child.findById(childToUse);

          if (!child) {
            throw new Error("Child is not found");
          }

          // Check Any update for purchased course ( if admin alter content )
          const progress = await Progress.findOne({
            regionId: req.user?.region,
            gradeId: child.grade,
            childId: child._id,
            semester: child.semester,
          });
          if (progress) {
            console.log("inside check")
            const updateDataEntry = await UpdateAdminDataEntryLog.findOne({
              region: req.user.region,
              semester: child.semester,
              grade: child.grade,
            });
            if (updateDataEntry) {
              console.log("updateDataEntry",updateDataEntry.updatedAt)
              console.log("progress",progress.updatedAt)
              if (updateDataEntry.updatedAt > progress?.updatedAt) {
                updateProgressStructure(
                  req.user?.region,
                  parent._id,
                  progress.childId,
                  progress.gradeId,
                  progress.semester
                );
                return { success: true, message: "UPDATE STRUCTURE" };
                // so update message displayed in APP. and again index page request is sent.
              }
            }
          }

          // Fetch the semester data based on the child's grade and semester
          sem = await findSemesterAndOthers(child.grade, semesterName);
        }
        const selectedSemester = sem.selectedSemester;
        const otherSemesters = sem.otherSemesters;

        // Generate signed URLs for the subjects' images
        const subjectsWithSignedUrls = await Promise.all(
          selectedSemester.subjects.map(async (subject) => {
            const signedUrl = await generateSignedUrl(subject.image);
            return {
              ...subject._doc,
              image: signedUrl,
            };
          })
        );

        return {
          success: true,
          message: "Subject data fetched successfully",
          data: {
            selectedSemester: {
              semesterName: selectedSemester.semesterName,
              subjects: subjectsWithSignedUrls,
            },
            otherSemesters,
          },
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error fetching data: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },

    // Fetch A Subject with Progress
    fetchASubjectWithProgress: async (
      _: any,
      { subjectId, childId }: { subjectId: string; childId?: string },
      { req }: MyContext
    ) => {
      try {
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const parent = await Parent.findById(req.user.id);
        if (!parent) {
          throw new Error("Parent not found");
        }

        // Check for progress for the selected child
        const progress = await Progress.findOne({
          childId: childId,
          "subjects.subjectId": subjectId,
        });

        if (!progress) {
          return unsubscribedUnitPage(subjectId);
        }

        // Fetch the subject and units
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          throw new Error("Subject not found");
        }

        // Build response with progress
        const subjectProgress = progress.subjects.find(
          (sub) => sub.subjectId.toString() === subjectId
        );
        if (!subjectProgress) {
          throw new Error("Subject not found in progress model");
        }
        const unitsWithProgress = subject.unit.map((unit) => {
          const progressUnit = subjectProgress.units.find(
            (unitProgress) =>
              unitProgress.unitId.toString() === unit.unitObjectId.toString()
          );
          return {
            unitNo: unit.unitNo,
            unitName: unit.unitName,
            unitId: unit.unitObjectId,
            unitProgressId: progressUnit ? progressUnit.unitProgressId : null,
            progressPercentage: progressUnit
              ? progressUnit.progressPercentage
              : null,
          };
        });

        const signedUrl = await generateSignedUrl(subject.subjectImage);

        return {
          success: true,
          message: "Subject data fetched successfully",
          data: {
            subjectName: subject.subjectName,
            subjectImage: signedUrl,
            subjectDescription: subject.subjectDescription,
            totalUnit: subject.totalUnit,
            lesson: subject.lesson, // Assuming lessons field exists
            units: unitsWithProgress,
          },
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error fetching data: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },

    // Fetch A Unit with progress
    fetchAUnitWithProgress: async (
      _: any,
      {
        unitId,
        unitProgressId,
      }: { unitId: string; unitProgressId: string | null },
      { req }: MyContext
    ) => {
      try {
        // Check if the user is authenticated
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        // Fetch the unit details
        const unit = await Unit.findById(unitId);
        if (!unit) {
          throw new Error("Unit not found");
        }

        // If unitProgressId is null, it means the user is not subscribed
        if (!unitProgressId) {
          return {
            success: true,
            message: "User is not subscribed",
            data: {
              unitNo: unit.unitNo,
              unitName: unit.unitName,
              totalLessons: unit.lesson.length,
              lessons: unit.lesson.map((lesson) => ({
                lessonNo: lesson.lessonNo,
                lessonName: lesson.lessonName,
                lessonId: lesson.lessonId,
                lessonProgressId: null,
                progressPercentage: null,
              })),
            },
          };
        }

        // Fetch unit progress details using unitProgressId
        const unitProgress = await UnitProgress.findById(unitProgressId);
        if (!unitProgress || unitProgress.unitId.toString() !== unitId) {
          throw new Error("Unit progress not found or mismatched");
        }

        // Map lessons with progress details
        const lessonsWithProgress = unit.lesson.map((lesson) => {
          const lessonProgress = unitProgress.lessons.find(
            (lp) => lp.lessonId.toString() === lesson.lessonId.toString()
          );
          return {
            lessonNo: lesson.lessonNo,
            lessonName: lesson.lessonName,
            lessonId: lesson.lessonId,
            lessonProgressId: lessonProgress
              ? lessonProgress.lessonProgressId
              : null,
            progressPercentage: lessonProgress
              ? lessonProgress.progressPercentage
              : null,
          };
        });

        // Build response
        return {
          success: true,
          message: "Unit with progress fetched successfully",
          data: {
            unitNo: unit.unitNo,
            unitName: unit.unitName,
            totalLessons: unit.lesson.length,
            lessons: lessonsWithProgress,
          },
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error fetching unit: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },

    // Fetch A Lesson with Progress
    fetchALessonWithChapter: async (
      _: any,
      {
        lessonId,
        lessonProgressId,
        childId,
      }: { lessonId: string; lessonProgressId?: string; childId?: string },
      { req }: MyContext
    ) => {
      try {
        // Check if the user is authenticated
        if (!req.user) {
          throw new Error("User is not authenticated");
        }
        // Fetch the lesson by ID
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
          throw new Error("Lesson not found");
        }

        // Check if the user is subscribed
        let isSubscribed = false;
        if (lessonProgressId && childId) {
          // Fetch the child by ID
          const child = await Child.findById(childId);
          if (!child) {
            throw new Error("Child not found");
          }

          // Check if the subscription key exists in the child's subscription array
          isSubscribed = child.subscriptions.includes(lesson.subscriptionKey);
        }

        // Handle unsubscribed user case
        if (!isSubscribed) {
          const chapters = await Promise.all(
            lesson.chapter.map(async (chapter, index) => {
              if (index === 0) {
                // Get the signed URL for the first chapter if it's not a webpage
                if (chapter.chapterType !== "webpage") {
                  const signedUrl = await generateSignedUrl(
                    chapter.chapterContent
                  );
                  return {
                    chapterNumber: chapter.chapterNumber,
                    chapterName: chapter.chapterName,
                    chapterType: chapter.chapterType,
                    chapterContent: signedUrl,
                    progressPercentage: null,
                  };
                }
                return chapter; // First chapter if it's a webpage
              } else {
                // For unsubscribed users, return null for content in other chapters
                return {
                  chapterNumber: chapter.chapterNumber,
                  chapterName: chapter.chapterName,
                  chapterType: chapter.chapterType,
                  chapterContent: "",
                  progressPercentage: null,
                };
              }
            })
          );

          return {
            success: true,
            message: "Unsubscribed user: Only the first chapter is available",
            data: {
              lessonName: lesson.lessonName,
              chapters,
            },
          };
        }

        // For subscribed users, fetch the lesson progress (if exists)
        let lessonProgress = null;
        if (lessonProgressId) {
          lessonProgress = await LessonProgress.findById(lessonProgressId);
        }

        const chaptersWithProgress = await Promise.all(
          lesson.chapter.map(async (chapter, index) => {
            const progressChapter = lessonProgress
              ? lessonProgress.chapters.find(
                  (progress) =>
                    progress.chapterNo === Number(chapter.chapterNumber)
                )
              : null;

            if (chapter.chapterType !== "webpage" && index === 0) {
              // Get the signed URL for the first chapter's content (if it's not a webpage)
              const signedUrl = await generateSignedUrl(chapter.chapterContent);
              return {
                chapterNumber: chapter.chapterNumber,
                chapterName: chapter.chapterName,
                chapterType: chapter.chapterType,
                chapterContent: signedUrl,
                progressPercentage: progressChapter
                  ? progressChapter.progressPercentage
                  : null,
              };
            }

            return {
              chapterNumber: chapter.chapterNumber,
              chapterName: chapter.chapterName,
              chapterType: chapter.chapterType,
              chapterContent: chapter.chapterContent, // Provide actual content for subscribed users
              progressPercentage: progressChapter
                ? progressChapter.progressPercentage
                : null,
            };
          })
        );

        return {
          success: true,
          message: "Lesson data fetched successfully",
          data: {
            lessonName: lesson.lessonName,
            chapters: chaptersWithProgress,
          },
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error fetching lesson: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },

    signedUrlUser: async (
      _: any,
      {
        lessonId,
        chapterNumber,
        chapterContent,
      }: { lessonId?: string; chapterNumber?: string; chapterContent?: string },
      { req }: MyContext
    ) => {
      // Step 1: Check if the user is authenticated
      if (!req.user) {
        throw new Error("User is not authenticated");
      }

      // Step 2: Find the lesson by lessonId
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return {
          success: false,
          message: "Lesson not found",
          signedUrl: null,
        };
      }

      // Step 3: Find the chapter based on chapterNumber
      const chapter = lesson.chapter.find(
        (chap) => chap.chapterNumber === chapterNumber
      );
      if (!chapter) {
        return {
          success: false,
          message: "Chapter not found",
          signedUrl: null,
        };
      }

      // Step 4: Check if the chapter content matches the provided content
      if (chapter.chapterContent !== chapterContent) {
        return {
          success: false,
          message: "Chapter content does not match",
          signedUrl: null,
        };
      }

      // Step 5: Check if chapterContent is a web URL; no need to sign web URLs
      if (chapter.chapterType === "webpage") {
        return {
          success: true,
          message: "No signing needed for web content",
          signedUrl: chapter.chapterContent,
        };
      }

      // Step 6: For non-web content, generate a signed URL
      try {
        const signedUrl = await generateSignedUrl(chapterContent);
        return {
          success: true,
          message: "Signed URL generated successfully",
          signedUrl,
        };
      } catch (err) {
        return {
          success: false,
          message: "Error generating signed URL",
          signedUrl: null,
        };
      }
    },
  },
};
