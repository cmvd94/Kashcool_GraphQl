import { gql } from "graphql-tag";

export const deleteParentChildSchema = gql`
  # Define a mutation response type for delete operations
  type MutationResponse {
    success: Boolean!
    message: String!
  }

  # The Mutation type for handling parent and child deletions
  type Mutation {
    # Mutation to delete a parent and all related children
    deleteParent(parentId: ID!): MutationResponse!

    # Mutation to delete a specific child
    deleteChild(childId: ID!): MutationResponse!
  }
`;
