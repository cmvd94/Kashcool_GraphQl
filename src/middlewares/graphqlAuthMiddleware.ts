import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { redisClient } from "../config/redisDbTTL"; // Import your Redis client
import { qraphQlCustomRequest } from "../types/customRequest";
import { Parent } from "../models/parent";
import { Admin } from "../models/admin";

// Authentication Middleware for GRAPHQL.(admin & client)
// Here if token is available, which is verfied and set in req.user, if not there is two cases
// 1. No jwt token - when register , login etc during which jwt token is not needed. in those case resolver does not have check condition
// 2. when wrong/invalid token then req.user = null , resolver check of req.user if not available return unauthorized

export const graphqlAuthMiddleware = async (
  req: qraphQlCustomRequest,
  res: Response,
  next: NextFunction
) => {
  
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Assuming Bearer token is sent in the header
    if (token) {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET_KEY;
      if (!jwtSecret) {
        return res.status(500).json({ message: "JWT secret is missing" });
      }

      const decodedToken = jwt.verify(token, jwtSecret) as {
        id: string;
        role: string;
        authUser: string;
      };

       // Check if the token is still valid in Redis
      const tokenKey = `jwtToken:${decodedToken.id}:${token}`;
      const storedToken = await redisClient.get(tokenKey);
      //console.log(storedToken,token)
      if (storedToken !== token) {
        return res
          .status(401)
          .json({ message: "Invalid token or session expired" });
      }

      // Another method
      //const tokenExists = await redisClient.exists(tokenKey);
      // if (!tokenExists) {
      //   return res.status(401).json({ message: "Token is no longer valid" });
      // }

      // Find the parent/Admin by ID and set it in req.user
      if (decodedToken.authUser === "admin") {
        const admin = await Admin.findById(decodedToken.id);
        if (!admin) {
          return res.status(404).json({ message: "Admin not found" });
        }
        req.user = {
          id: admin._id,
          authUser: "admin",
          name: admin.name,
          role: admin.role,
          region: admin.region,
        };
      } else if (decodedToken.authUser === "client") {
        const parent = await Parent.findById(decodedToken.id);
        if (!parent) {
          return res.status(404).json({ message: "Parent not found" });
        }
        req.user = {
          id: parent._id,
          authUser: "client",
          name: parent.name,
          role: null,
          region: parent.region,
        };
      }
    } else {
      // no token(eg for login page) or user is not authenticated
      req.user = null;
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    if (error instanceof Error) {
      return res
        .status(401)
        .json({ message: "Invalid token", error: error.message });
    } else {
      return res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};
