import mongoose, { Document, Schema } from "mongoose";

// Define the interface for PurchaseDocument
export interface PurchaseDocument extends Document {
  orderId: string;
  region: mongoose.Schema.Types.ObjectId;
  grade: mongoose.Schema.Types.ObjectId;
  semester: string;
  parentId: mongoose.Schema.Types.ObjectId;
  childId: mongoose.Schema.Types.ObjectId;
  purchaseDate: Date;
}

// Define the schema for PurchaseModel
const purchaseSchema = new mongoose.Schema<PurchaseDocument>({
  orderId: { type: String, required: true },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Region",
    required: true,
  },
  grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
  semester: { type: String, required: true },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
    required: true,
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  purchaseDate: { type: Date, default: Date.now },
});

// Define the Purchase model
export const PurchaseModel = mongoose.model<PurchaseDocument>(
  "Purchase",
  purchaseSchema
);
