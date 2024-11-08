import { gql } from "graphql-tag";

export const childProgressUpdate = gql`
  input updateProgress {
    lessonProgressId: ID!
    childId: ID!
    chapterNumber: Int!
    progressPercentage: Float!
    timeWatched: Float
  }

  type ProgressUpdateResponse {
    success: Boolean!
    message: String!
  }
  type Mutation {
    updateLessonProgress(input: updateProgress): ProgressUpdateResponse
  }
`;
