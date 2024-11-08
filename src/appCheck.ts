import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import GraphQL and routes
import { initializeApolloServer } from "./graphql/apollo";
import adminAuthRoute from "./routes/adminAuthRoute";
import regionRoute from "./routes/regionRoute";
import gradeRoute from "./routes/gradeRoute";
import subjectRoute from "./routes/subjectRoute";
import unitRoute from "./routes/unitRoute";
import lessonRoute from "./routes/lessonRoute";
import userRoute from "./routes/userRoute";
import childRoute from "./routes/childRoute";
import amountRoute from "./routes/amountRoute";
import { setupSuperAdmin } from "./config/setupSuperAdmin";

dotenv.config();

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  // Initializes middleware
  private initializeMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  // Sets up REST API routes
  private initializeRoutes() {
    this.app.use("/admin", adminAuthRoute);
    this.app.use("/regions", regionRoute);
    this.app.use("/grades", gradeRoute);
    this.app.use("/subject", subjectRoute);
    this.app.use("/unit", unitRoute);
    this.app.use("/lesson", lessonRoute);
    this.app.use("/user", userRoute);
    this.app.use("/child", childRoute);
    this.app.use("/amount", amountRoute);

    // Payment callback route
    this.app.get('/payment/callback', (req, res, next) => {
      const { razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_reference_id, razorpay_payment_link_status, razorpay_signature } = req.query;
      console.log("Payment callback received with details:", {
        razorpay_payment_id,
        razorpay_payment_link_id,
        razorpay_payment_link_reference_id,
        razorpay_payment_link_status,
        razorpay_signature
      });
      next();
    });
  }

  // Initializes the Apollo Server
  public async initializeApollo() {
    await initializeApolloServer(this.app);
  }

  // Returns the configured app instance
  public getAppInstance() {
    return this.app;
  }
}

export default App;
