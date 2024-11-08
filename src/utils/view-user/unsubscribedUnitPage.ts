import { Subject } from "../../models/subject";
import { generateSignedUrl } from "../generateSignedUrl";


export const unsubscribedUnitPage = async (subjectId: string) => {
    const subject = await Subject.findById(subjectId)
    if (!subject) {
      throw new Error("Subject not found");
    }
  
    const signedUrl = await generateSignedUrl(subject.subjectImage);
  
    const unitsWithoutProgress = subject.unit.map((unit) => ({
      unitNo: unit.unitNo,
      unitName: unit.unitName,
      unitId: unit.unitObjectId,
      unitProgressId: null,
      progressPercentage: null,
    }));
  
    return {
      success: true,
      message: "Unsubscribed account - Progress data not available",
      data: {
        subjectName: subject.subjectName,
        subjectImage: signedUrl,
        subjectDescription: subject.subjectDescription,
        totalUnit: subject.totalUnit,
        lesson: subject.lesson, // Assuming lessons field exists
        units: unitsWithoutProgress,
      },
    };
  };