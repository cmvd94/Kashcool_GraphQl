export interface subjectAdminPageInput {
  subjectId: string;
  semester: string;
}

export interface UnitAdminPageInput {
  unitId: string;
  subjectId: string;
}

export interface LessonAdminPageInput {
  lessonId: string;
  unitId: string;
}

export interface SignedURl {
  unitId: string;
  lessonId: string;
  chapterContent: string;
}
