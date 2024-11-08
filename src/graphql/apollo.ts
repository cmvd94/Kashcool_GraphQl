// graphql/apolloServer.ts
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser"; // For parsing the GraphQL requests
import { Express } from "express";

import { qraphQlCustomRequest } from "../types/customRequest";
import { resolvers } from "./resolvers/resolvers"; // Import your resolvers
import { typeDefs } from "./schema/schema"; // Import your GraphQL schema
import { graphqlAuthMiddleware } from "../middlewares/graphqlAuthMiddleware";

// Define the MyContext interface
export interface MyContext {
  req: qraphQlCustomRequest; // Custom request with user object
}

// This function initializes Apollo Server and attaches it to the Express app
export async function initializeApolloServer(app: Express) {
  const apolloServer = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    
    //no need context here
  });

  // Start Apollo Server
  await apolloServer.start();

  // Attach Apollo Server middleware to the `/graphql` endpoint
  app.use(
    "/graphql",
    bodyParser.json(),
    async (req, res, next) => {
      await graphqlAuthMiddleware(req, res, next); // Ensure req.user is set or null
    },
    expressMiddleware(apolloServer, {
      context: async ({ req }: { req: qraphQlCustomRequest }) => {
        // Pass req (with req.user if authenticated) to the context
        return {req}
      },
    }),
    
  );

  console.log("Apollo Server is running at /graphql");
}
