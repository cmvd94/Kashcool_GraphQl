import { userQueryResolver } from "./user/userQueryResolver";
import { userMutationResolver } from "./user/userMutationResolver";
import { childMutationResolvers } from "./user/childMutationResolver";
import { childQueryResolvers } from "./user/childQueryResolver";
import { subscriptionResolver } from "./razorPay/subscriptionResolver";
import { childProgressResolver } from "./view-user/childProgressUpdate";
import { adminViewResolver } from "./view-admin/view";
import { clientViewResolver } from "./view-user/view";
import { deleteParentChild } from "./view-user/deleteParentChild";

export const resolvers = {
  Query: {
    ...userQueryResolver.Query,  // Spread the Query resolvers
    ...childQueryResolvers.Query,
    ...subscriptionResolver.Query,
    ...adminViewResolver.Query,
    ...clientViewResolver.Query,
  },
  Region: {
    ...userQueryResolver.Region,  // Include Region resolvers
  },
  RegionGrade: {
    ...userQueryResolver.RegionGrade,  // Include RegionGrade resolvers
  },
  Mutation: {
    ...userMutationResolver.Mutation,
    ...childMutationResolvers.Mutation,
    ...subscriptionResolver.Mutation,
    ...childProgressResolver.Mutation,
    ...deleteParentChild.Mutation
   
   }, 
  Child: {
    ...childQueryResolvers.Child,
  }
}; 