import "reflect-metadata";

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Import your Apollo Server setup
import { initializeApolloServer } from "./graphql/apollo";

// Import your REST API routes
import adminAuthRoute from "./routes/adminAuthRoute";
import regionRoute from "./routes/regionRoute";
import gradeRoute from "./routes/gradeRoute";
import subjectRoute from "./routes/subjectRoute";
import unitRoute from "./routes/unitRoute";
import lessonRoute from "./routes/lessonRoute";
import userRoute from "./routes/userRoute";
import childRoute from "./routes/childRoute";
import amountRoute from "./routes/amountRoute"

import { setupSuperAdmin } from "./config/setupSuperAdmin";
dotenv.config();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.rj3wp52.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors()); // Enable CORS
app.use(express.json()); // REST API Uses

// REST API routes (admin side)
app.use("/admin", adminAuthRoute); // SuperAdmin
app.use("/regions", regionRoute);
app.use("/grades", gradeRoute);
app.use("/subject", subjectRoute);
app.use("/unit", unitRoute);
app.use("/lesson", lessonRoute);
app.use("/user", userRoute); // User route for REST APIs, if needed
app.use("/child", childRoute);
app.use("/amount",amountRoute);



// used to get payment id. in general which is sent from frontend
app.get('/payment/callback', (req, res, next) => {
  const { razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_reference_id, razorpay_payment_link_status, razorpay_signature } = req.query;

    console.log("razorpay_payment_id:", razorpay_payment_id);
    console.log("razorpay_payment_link_id:", razorpay_payment_link_id);
    console.log("razorpay_payment_link_reference_id:", razorpay_payment_link_reference_id);
    console.log("razorpay_payment_link_status:", razorpay_payment_link_status);
    console.log("razorpay_signature:", razorpay_signature);

    next();
}) 



/* // Default route
app.use('/', (req, res, next) => {
  res.status(200).json({ message: "success" });
}); */

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    setupSuperAdmin(); // Set up super admin
    // Initialize Apollo GraphQL server for the user/client side
    await initializeApolloServer(app);
  })
  .then(() => {
    console.log("Connected to database");
    app.listen(PORT, () => {
      console.log(`Server is listening on PORT ${PORT}`);
      console.log(`GraphQL Server ready at http://localhost:${PORT}/graphql`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
