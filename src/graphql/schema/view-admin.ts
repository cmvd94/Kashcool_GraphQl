import { gql } from "graphql-tag";

export const adminView = gql`
  type SubjectHomePage {
    subjectId: ID!
    subjectName: String!
    image: String!
  }

  type Semester {
    semesterName: String!
    subjects: [SubjectHomePage!]!
  }

  type IndexPageData {
    selectedSemester: Semester!
    otherSemesters: [String!]!
  }

  type IndexPageResponse {
    success: Boolean!
    message: String!
    data: IndexPageData
  }

  # Define the input type for the query
  input GetSubjectDetailsInput {
    subjectId: ID! # Required subject ID
    semester: String! # Required semester name
  }

  # Define the type for a Unit
  type UnitSubject {
    unitNo: Int! # Unit number
    unitName: String! # Unit name
    unitObjectId: ID! # Reference to another Unit document
  }

  # Define the type for the Subject details
  type SubjectDetails {
    _id: ID! # Subject ID
    region: ID! # Reference to the region
    gradeId: ID! # Reference to the grade
    semester: String! # Semester (e.g., "Semester 1")
    subjectName: String! # Subject name
    subjectImage: String! # URL of the subject's image
    subjectDescription: String! # Description of the subject
    subjectQuiz: ID # Reference to a Quiz model (nullable)
    lesson: Int! # Number of lessons
    totalUnit: Int # Total units (nullable)
    unit: [UnitSubject!]! # Array of units
  }

  input UnitAdminPageInput {
    unitId: ID!
    subjectId: ID!
  }

  type LessonUnit {
    lessonNo: Int!
    lessonName: String!
    lessonId: ID!
  }
  type UnitDetailsResponse {
    _id: ID!
    region: ID!
    subjectId: ID!
    unitNo: Int!
    unitName: String!
    lesson: [LessonUnit!]!
  }

  input LessonAdminPageInput {
    unitId: ID!
    lessonId: ID!
  }

  type LessonDetailsResponse {
    _id: ID!
    unitId: ID!
    lessonNo: Int!
    lessonName: String!
    chapter: [Chapter!]!
  }

  type Chapter {
    chapterNumber: String!
    chapterName: String!
    chapterType: String!
    chapterContent: String!
  }

  input ChapterSignedUrl {
    unitId: ID!
    lessonId: ID!
    chapterContent: String!
  }

  type SignedUrl {
    message: String!
    url: String!
  }
  type Query {
    indexPage(semesterName: String): IndexPageResponse!
    getSubjectDetailsByAdmin(input: GetSubjectDetailsInput!): SubjectDetails!
    getUnitDetailsByAdmin(input: UnitAdminPageInput!): UnitDetailsResponse!
    getLessonDetailsByAdmin(
      input: LessonAdminPageInput!
    ): LessonDetailsResponse!
    getSignedChapterContent(input: ChapterSignedUrl!): SignedUrl!
  }
`;

