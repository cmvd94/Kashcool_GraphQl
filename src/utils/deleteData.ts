import { Region } from '../models/region';
import { Grade } from '../models/grade';
import { Subject } from '../models/subject';
import { Unit } from '../models/unit';
import { Lesson } from '../models/lesson';
import mongoose from 'mongoose';
import { deleteS3Object } from './deleteS3Object';

// Delete Region and Associated Grades with Transaction
export const deleteRegion = async (
    regionId: mongoose.Schema.Types.ObjectId,
    session?: mongoose.ClientSession
) => {
    let newSession = false; // Flag to track if a new session is created

    try {
        // If no session is provided, create a new one and start a transaction
        if (!session) {
            session = await mongoose.startSession();
            session.startTransaction();  // Start transaction
            newSession = true;  // Set flag to true
        }

        // Find the region by its ID within the session
        const region = await Region.findById(regionId).session(session);
        if (!region) throw new Error('Region not found');

        // Find and delete all associated grades
        const grades = await Grade.find({ region: regionId }).session(session);
        for (const grade of grades) {
            await deleteGrade(grade._id.toString(), region.regionName, session); // Pass session to deleteGrade
        }

        // Delete the region itself
        await Region.deleteOne({ _id: regionId }).session(session);
        console.log(`Region ${regionId} and associated grades deleted successfully.`);

        // Commit the transaction if we started it
        if (newSession) {
            await session.commitTransaction();
        }

    } catch (err) {
        // Abort the transaction if an error occurs and we started a new session
        if (newSession && session) {
            await session.abortTransaction();
        }
        console.error(`Error deleting region ${regionId}:`, err);
        throw err;

    } finally {
        // End the session if it was created in this function
        if (newSession && session) {
            session.endSession();
        }
    }
};
// Delete Grade and Associated Subjects with Transaction
export const deleteGrade = async (
    gradeId: string,
    region: string,
    session?: mongoose.ClientSession
) => {
    let newSession = false; // Flag to track if a new session is created

    try {
        // If no session is provided, create a new one and start a transaction
        if (!session) {
            session = await mongoose.startSession();
            session.startTransaction();  // Start transaction
            newSession = true;  // Set flag to true
        }

        // Find the grade by its ID within the session
        const grade = await Grade.findById(gradeId).session(session);
        if (!grade) throw new Error('Grade not found');

        // Check if semesters is defined before iterating
        if (grade.semesters) {
            for (const semester of grade.semesters) {
                if (semester.subjects) { // Ensure subjects is defined
                    for (const subject of semester.subjects) {
                        // Pass region, gradeId, and semesterName to deleteSubject
                        await deleteSubject(subject.subjectId.toString(), region, gradeId, semester.semesterName, session);
                    }
                }
            }
        } else {
            console.warn(`No semesters found for grade ${gradeId}.`);
        }

        // Delete the grade itself
        await Grade.deleteOne({ _id: gradeId }).session(session);
        console.log(`Grade ${gradeId} and associated subjects deleted successfully.`);

        // Commit the transaction if we started it
        if (newSession) {
            await session.commitTransaction();
        }

    } catch (err) {
        // Abort the transaction if an error occurs and we started a new session
        if (newSession && session) {
            await session.abortTransaction();
        }
        console.error(`Error deleting grade ${gradeId}:`, err);
        throw err;

    } finally {
        // End the session if it was created in this function
        if (newSession && session) {
            session.endSession();
        }
    }
};

// Delete Subject and Associated Units with Transaction
export const deleteSubject = async (
    subjectId: string,
    region: string,
    grade: string,
    semesterName: string,
    session?: mongoose.ClientSession
) => {
    let newSession = false; // Flag to track if a new session is created

    try {
        // If no session is provided, create a new one and start a transaction
        if (!session) {
            session = await mongoose.startSession();
            session.startTransaction();  // Start transaction
            newSession = true;  // Set flag to true
        }

        // Find the subject by its ID within the session
        const subject = await Subject.findById(subjectId).session(session);
        if (!subject) throw new Error('Subject not found');

        // Delete the subject image from S3 using the utility function
        await deleteS3Object(subject.subjectImage);

        // Delete associated units
        for (const unit of subject.unit) {
            await deleteUnit(unit.unitObjectId.toString(), region, grade.toString(), subjectId, session); // Pass session and relevant parameters to unit deletion
        }

        // Delete the subject itself
        await Subject.deleteOne({ _id: subjectId }).session(session);
        console.log(`Subject ${subjectId} and associated image deleted successfully.`);

        // Remove the subject from the associated grade and semester
        const gradeDoc = await Grade.findById(grade).session(session); // Find the grade document by ID
        if (gradeDoc && gradeDoc.semesters) {
            const semester = gradeDoc.semesters.find(s => s.semesterName === semesterName);
            if (semester) {
                // Remove the subject from the semester's subjects array
                semester.subjects = semester.subjects.filter(
                    (subject) => subject.subjectId.toString() !== subjectId.toString()
                );
            }

            // Save the updated grade document
            await gradeDoc.save({ session });
            console.log(`Subject ${subjectId} removed from Grade ${gradeDoc._id}, Semester ${semesterName}.`);
        } else {
            console.warn(`No grade found for ID ${grade} or it has no semesters.`);
        }

        // Commit the transaction if we started it
        if (newSession) {
            await session.commitTransaction();
        }

    } catch (err) {
        // Abort the transaction if an error occurs and we started a new session
        if (newSession && session) {
            await session.abortTransaction();
        }
        console.error(`Error deleting subject ${subjectId}:`, err);
        throw err;

    } finally {
        // End the session if it was created in this function
        if (newSession && session) {
            session.endSession();
        }
    }
};

// Delete Unit and Associated Lessons with Transaction
export const deleteUnit = async (
    unitId: string,
    region: string,
    grade: string,
    subjectId: string,
    session?: mongoose.ClientSession
) => {
    let newSession = false; // Flag to track if a new session is created

    try {
        // If no session is provided, create a new one and start a transaction
        if (!session) {
            session = await mongoose.startSession();
            session.startTransaction();  // Start transaction
            newSession = true;  // Set flag to true
        }

        // Find the unit by its ID within the session
        const unit = await Unit.findById(unitId).session(session);
        if (!unit) throw new Error('Unit not found');

        // Delete associated lessons
        for (const lesson of unit.lesson) {
            await deleteLesson(lesson.lessonId.toString(), unitId, region, grade, session); // Pass unitId, region, grade, and session to lesson deletion
        }

        // Delete the unit itself
        await Unit.deleteOne({ _id: unitId }).session(session);
        console.log(`Unit ${unitId} deleted successfully.`);

        // Remove the unit from the associated subject
        const subject = await Subject.findById(subjectId).session(session);
        if (subject) {
            // Check if the unit exists in the subject before trying to modify it
            if (subject.unit) {
                subject.unit = subject.unit.filter(
                    (unit) => unit.unitObjectId.toString() !== unitId.toString()
                );

                // Save the updated subject
                await subject.save({ session });
                console.log(`Unit ${unitId} removed from Subject ${subject._id}.`);
            } else {
                console.warn(`Subject ${subject._id} has no associated units.`);
            }
        } else {
            console.warn(`No subject found with ID ${subjectId}.`);
        }

        // Commit the transaction if we started it
        if (newSession) {
            await session.commitTransaction();
        }

    } catch (err) {
        // Abort the transaction if an error occurs and we started a new session
        if (newSession && session) {
            await session.abortTransaction();
        }
        console.error(`Error deleting unit ${unitId}:`, err);
        throw err;

    } finally {
        // End the session if it was created in this function
        if (newSession && session) {
            session.endSession();
        }
    }
};


export const deleteLesson = async (
    lessonId: string,
    unitId: string,
    region: string,
    grade: string,
    session?: mongoose.ClientSession
) => {
    let newSession = false; // Flag to track if a new session is created

    try {
        // If no session is provided, create a new one and start a transaction
        if (!session) {
            session = await mongoose.startSession();
            session.startTransaction();  // Start transaction
            newSession = true;  // Set flag to true
        }

        // Find the lesson by its ID within the session
        const lesson = await Lesson.findById(lessonId).session(session);
        if (!lesson) throw new Error("Lesson not found");

        // Delete all chapters in the lesson
        for (const chapter of lesson.chapter) {
            await deleteChapter(lessonId, chapter.chapterNumber, session);
        }

        // Delete the lesson itself
        await Lesson.deleteOne({ _id: lessonId }).session(session);
        console.log(`Lesson ${lessonId} and associated chapters deleted successfully.`);

        // Remove the lesson from the associated unit
        const unit = await Unit.findById(unitId).session(session);
        if (unit) {
            unit.lesson = unit.lesson.filter(
                (lesson) => lesson.lessonId.toString() !== lessonId.toString()
            );

            // Save the updated unit
            await unit.save({ session });
            console.log(`Lesson ${lessonId} removed from Unit ${unit._id}.`);
        } else {
            console.warn(`No unit found with ID ${unitId}.`);
        }

        // Commit the transaction if we started it
        if (newSession) {
            await session.commitTransaction();
        }

    } catch (err) {
        // Abort the transaction if an error occurs and we started a new session
        if (newSession && session) {
            await session.abortTransaction();
        }
        console.error(`Error deleting lesson ${lessonId}:`, err);
        throw err;

    } finally {
        // End the session if it was created in this function
        if (newSession && session) {
            session.endSession();
        }
    }
};

// Delete Chapter with Transaction
export const deleteChapter = async (
    lessonId: string,
    chapterNumber: string,
    session?: mongoose.ClientSession
) => {
    let newSession = false; // Flag to track if a new session is created

    try {
        // If no session is provided, create a new one and start a transaction
        if (!session) {
            session = await mongoose.startSession();
            session.startTransaction();  // Start transaction
            newSession = true;  // Set flag to true
        }

        // Find the lesson by its ID within the session
        const lesson = await Lesson.findById(lessonId).session(session);
        if (!lesson) throw new Error("Lesson not found");

        // Find the chapter to delete
        const chapterIndex = lesson.chapter.findIndex(
            (chapter) => chapter.chapterNumber === chapterNumber
        );
        if (chapterIndex === -1) throw new Error("Chapter not found");

        const chapter = lesson.chapter[chapterIndex];

        // Delete S3 content if the chapter type is image or video
        if (["image", "video"].includes(chapter.chapterType)) {
            await deleteS3Object(chapter.chapterContent); // Utility function for S3 deletion
        }

        // Remove the chapter from the lesson
        lesson.chapter.splice(chapterIndex, 1);
        
        // Save the updated lesson
        await lesson.save({ session });

        // Commit the transaction if we started it
        if (newSession) {
            await session.commitTransaction();
        }

        console.log(`Chapter ${chapterNumber} from lesson ${lessonId} deleted successfully.`);
    } catch (err) {
        // Abort the transaction if an error occurs and we started a new session
        if (newSession && session) {
            await session.abortTransaction();
        }
        console.error(`Error deleting chapter ${chapterNumber}:`, err);
        throw err;
    } finally {
        // End the session if it was created in this function
        if (newSession && session) {
            session.endSession();
        }
    }
};