import { gql } from "graphql-tag";

export const viewUser = gql`
  # Index page User
  type IndexResponse {
    success: Boolean!
    message: String!
    data: SemesterData
  }

  type SemesterData {
    selectedSemester: SemesterUser
    otherSemesters: [String!]!
  }

  type SemesterUser {
    semesterName: String!
    subjects: [SubjectIndex!]!
  }

  type SubjectIndex {
    subjectId: ID!
    subjectName: String!
    image: String
  }

  # fetch A Subject with Progress
  type SubjectProgressResponse {
    success: Boolean!
    message: String!
    data: SubjectData
  }

  type SubjectData {
    subjectName: String!
    subjectImage: String!
    subjectDescription: String
    totalUnit: Int!
    lesson: Int!
    units: [SubUnitProgress!]!
  }

  type SubUnitProgress {
    unitNo: Int!
    unitName: String!
    unitId: ID!
    unitProgressId: ID
    progressPercentage: Float
  }

  #Fetch A Unit with progress
  type FetchUnitWithProgressResponse {
    success: Boolean!
    message: String!
    data: UnitWithProgress
  }
  type UnitWithProgress {
    unitNo: Int!
    unitName: String!
    totalLessons: Int!
    lessons: [UnitLessonWithProgress!]!
  }
  type UnitLessonWithProgress {
    lessonNo: Int!
    lessonName: String!
    lessonId: ID!
    lessonProgressId: ID
    progressPercentage: Float
  }

  # Fetch A Lesson with chapter
  type Chapter {
    chapterNumber: String!
    chapterName: String!
    chapterType: String!
    chapterContent: String # Content could be null for unsubscribed users
    progressPercentage: Float # For subscribed users, if progress exists
  }

  type Lesson {
    lessonName: String!
    chapters: [Chapter!]!
  }

  type FetchLessonWithChapterResult {
    success: Boolean!
    message: String!
    data: Lesson
  }

  #Signed URL
  type SignedUrlResult {
    success: Boolean!
    message: String!
    signedUrl: String # Contains the signed URL if successful
  }

  type Query {
    indexPageUser(gradeId: ID, childId: ID, semesterName: String): IndexResponse

    fetchASubjectWithProgress(subjectId: ID!): SubjectProgressResponse

    fetchAUnitWithProgress(
      unitId: ID!
      unitProgressId: ID
    ): FetchUnitWithProgressResponse!

    fetchALessonWithChapter(
      lessonId: ID!
      lessonProgressId: ID
      childId: ID
    ): FetchLessonWithChapterResult!

    signedUrlUser(
      lessonId: ID!
      chapterNumber: String!
      chapterContent: String!
    ): SignedUrlResult!
  }
`;
