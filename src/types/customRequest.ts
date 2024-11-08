// src/types/CustomRequest.ts
import { Request } from "express";
import mongoose from "mongoose";

// Used in Rest API
export interface CustomRequest extends Request {
  user?: {
    id: mongoose.Schema.Types.ObjectId;
    name: string;
    role: string;
    region: mongoose.Schema.Types.ObjectId | null | undefined;
    grade: mongoose.Schema.Types.ObjectId | null | undefined;
  };
}

// Used in graphQl  
// make changes in userAuthMiddleware, clearUserToken
export interface qraphQlCustomRequest extends Request {
  user?: {
    id: mongoose.Schema.Types.ObjectId;
    authUser: string ;
    name: string;
    role: string | null;
    region: mongoose.Schema.Types.ObjectId | null | undefined;
  } | null ;
}



