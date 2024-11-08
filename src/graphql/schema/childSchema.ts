import { gql } from "graphql-tag";

export const childSchema = gql`
  # Define AddChildInput type
  type Grade {
    _id: ID!
    grade: String!
  }
  input AddChildInput {
    name: String!
    gender: String!
    schoolName: String!
    dateOfBirth: String! # Use String for date, then parse it in resolver
    grade: ID!
    semester: String!
  }

  # Define Child type for returning the child information
  type Child {
    _id: ID!
    parent: ID!
    name: String!
    gender: String!
    schoolName: String!
    dateOfBirth: String!
    childrenImage: String
    grade: Grade! # Populate the grade object with gradeName
    semester: String!
  }

  type createResponse {
    message: String!
  }

  type updateResponse {
    message: String!
  }
  type Query {
    getAllChildren: [Child!]!
  }

  # Define the mutation for adding a child
  type Mutation {
    addChild(input: AddChildInput!): createResponse!
    updateChild(childId: String!, input: AddChildInput!): updateResponse!
  }
`;
