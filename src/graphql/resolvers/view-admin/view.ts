import { Subject } from "../../../models/subject";
import { Admin } from "../../../models/admin";
import { Lesson } from "../../../models/lesson";
import { Unit } from "../../../models/unit";
import { MyContext } from "../../apollo";
import { findSemesterAndOthers } from "../../../utils/findSemesterSubjectIndex";
import { generateSignedUrl } from "../../../utils/generateSignedUrl";
import {
  subjectAdminPageInput,
  UnitAdminPageInput,
  LessonAdminPageInput,
  SignedURl,
} from "../../../types/adminInput";

export const adminViewResolver = {
  Query: {
    // Home Page if no semester input then 1 element in semester array or sent semester string
    indexPage: async (
      _: any,
      { semesterName }: { semesterName?: string },
      { req }: MyContext
    ) => {
      try {
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
          throw new Error("Admin not found");
        }

        if (!admin.region) {
          throw new Error("Please select a Region to proceed.");
        }
        if (!admin.grade) {
          throw new Error("Please select a grade to proceed.");
        }

        // Use the helper function to get the selected semester and other semesters
        const { selectedSemester, otherSemesters } =
          await findSemesterAndOthers(admin.grade, semesterName);

        //console.log("after semester fetch",selectedSemester, otherSemesters);
        // Generate signed URLs for each subject's image
        const subjectsWithSignedUrls = await Promise.all(
          selectedSemester.subjects.map(async (subject) => {
            const subjectObj = subject;
            const signedUrl = await generateSignedUrl(subjectObj.image);
            return {
              ...subject._doc,
              image: signedUrl,
            };
          })
        );
        //console.log("after signed Url",subjectsWithSignedUrls);
        // Return the data
        return {
          success: true,
          message: "Semester and subjects fetched successfully",
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

    // Subject page for admin
    getSubjectDetailsByAdmin: async (
      _: any,
      { input }: { input: subjectAdminPageInput },
      { req }: MyContext
    ) => {
      const { subjectId, semester } = input;
      try {
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
          throw new Error("Admin not found");
        }

        if (!admin.region) {
          throw new Error("Please select a Region to proceed.");
        }
        if (!admin.grade) {
          throw new Error("Please select a grade to proceed.");
        }

        // 1. Fetch the subject by subjectId and semester
        const subject = await Subject.findOne({
          _id: subjectId,
          semester: semester,
        })
          .lean()
          .exec();

        if (!subject) {
          throw new Error("Subject not found");
        }
        // 2. Generate signed URL for the subject image
        const signedImageUrl = await generateSignedUrl(subject.subjectImage);

        // 3. Map the units and return the subject data
        return {
          ...subject, // Use `_doc` to extract the raw document
          subjectImage: signedImageUrl, // Replace the image with the signed URL
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error fetching data: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },

    // Unit page for admin
    getUnitDetailsByAdmin: async (
      _: any,
      { input }: { input: UnitAdminPageInput },
      { req }: MyContext
    ) => {
      const { unitId, subjectId } = input;

      try {
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
          throw new Error("Admin not found");
        }

        if (!admin.region) {
          throw new Error("Please select a Region to proceed.");
        }
        if (!admin.grade) {
          throw new Error("Please select a grade to proceed.");
        }

        // 1. Fetch the unit by unitId and subjectId
        const unit = await Unit.findOne({
          _id: unitId,
          subjectId: subjectId,
        })
          .lean()
          .exec();

        if (!unit) {
          throw new Error("Unit not found");
        }

        // 2. Return the unit data
        return {
          ...unit, // Use `_doc` to extract the raw document
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error fetching data: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },

    // Lesson Page for admin
    getLessonDetailsByAdmin: async (
      _: any,
      { input }: { input: LessonAdminPageInput },
      { req }: MyContext
    ) => {
      const { unitId, lessonId } = input;

      try {
        // Authenticate the user (admin)
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
          throw new Error("Admin not found");
        }

        // Fetch the lesson by unitId and lessonId
        const lesson = await Lesson.findOne({
          _id: lessonId,
          unitId: unitId,
        })
          .lean()
          .exec();

        if (!lesson) {
          throw new Error("Lesson not found");
        }

        // Check the first chapter and generate signed URL if necessary
        if (lesson.chapter && lesson.chapter.length > 0) {
          const firstChapter = lesson.chapter[0];

          if (
            firstChapter.chapterType === "image" ||
            firstChapter.chapterType === "video"
          ) {
            // Generate a signed URL for the first chapter content
            firstChapter.chapterContent = await generateSignedUrl(
              firstChapter.chapterContent
            );
          }
        }

        // Return lesson details with potentially updated first chapter content
        return {
          ...lesson, // Return the lesson object
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error fetching lesson details: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },

    // chapter signed url
    getSignedChapterContent: async (
      _: any,
      { input }: { input: SignedURl },
      { req }: MyContext
    ) => {
      try {
        const { unitId, lessonId, chapterContent } = input;

        // 1. Verify if the user is authenticated
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
          throw new Error("Admin not found");
        }

        // 2. Fetch the lesson by unitId and lessonId
        const lesson = await Lesson.findOne({
          _id: lessonId,
          unitId: unitId,
        });

        if (!lesson) {
          throw new Error("Lesson not found");
        }

        // 3. Find the chapter with the provided chapterContent in the lesson's chapters array
        const chapter = lesson.chapter.find(
          (chap) => chap.chapterContent === chapterContent
        );

        if (!chapter) {
          throw new Error("Chapter content not found in lesson");
        }

        // 4. Check if the chapterContent is an S3 URL (assuming it has a known S3 prefix)
        if (!chapterContent) {
          throw new Error("chapterContent is empty");
        }

        // If the chapter type is "webpage", no need to generate signed URL
        if (chapter.chapterType === "webpage") {
          return {
            message: "success",
            url: chapterContent,
          };
        }

        // 5. Generate a signed URL for S3 content (for image or video chapter types)
        const signedUrl = await generateSignedUrl(chapterContent);

        if (!signedUrl) {
          throw new Error("chapterContent not found in S3 bucket");
        }

        // 6. Return the signed URL
        return {
          message: "success",
          url: signedUrl,
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error generating signed URL: ${err.message}`);
        }
        throw new Error("Unknown error occurred.");
      }
    },
  },
};
