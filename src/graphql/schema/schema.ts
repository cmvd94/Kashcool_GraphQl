import { gql } from "graphql-tag";

import { userSchema } from "./userSchema";
import { childSchema } from "./childSchema";
import { subscriptionSchema } from "./subscriptionSchema";
import { childProgressUpdate } from "./childProgressUpdate";
import { adminView } from "./view-admin";
import { viewUser } from "./view-user";
import { deleteParentChildSchema } from "./deleteParentChildSchema";
export const typeDefs = gql`
  ${userSchema}
  ${childSchema}
  ${subscriptionSchema}
  ${childProgressUpdate}
  ${adminView}
  ${viewUser}
  ${deleteParentChildSchema}
`;
