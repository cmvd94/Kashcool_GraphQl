// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import App from "./app";
// import { setupSuperAdmin } from "./config/setupSuperAdmin";

// dotenv.config();

// const PORT = process.env.PORT || 3000;
// const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.rj3wp52.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;

// // Create app instance
// const app = new App();

// // MongoDB connection and server initialization
// mongoose
//   .connect(MONGODB_URI)
//   .then(async () => {
//     await setupSuperAdmin(); // Set up super admin
//     await app.initializeApollo(); // Initialize GraphQL server
//     app.getAppInstance().listen(PORT, () => {
//       console.log(`Server is listening on PORT ${PORT}`);
//       console.log(`GraphQL Server ready at http://localhost:${PORT}/graphql`);
//     });
//   })
//   .catch((error) => {
//     console.error("Error connecting to database:", error);
//   });
