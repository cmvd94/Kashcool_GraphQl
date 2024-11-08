import mongoose, { Document, Schema } from "mongoose";

// Define the Child interface
export interface ChildDocument extends Document {
  _id: mongoose.Schema.Types.ObjectId; 
  parent: mongoose.Schema.Types.ObjectId; // Reference to Parent
  name: string; // Child's name
  gender: string; // Child's gender
  schoolName: string; // Child's school name
  dateOfBirth: Date; // Child's date of birth
  grade: mongoose.Schema.Types.ObjectId;
  semester: string;
  childrenImage: string | null; // URL or path to child's image
  subscriptions: string[]; // Array of subscription objects
  progress: mongoose.Schema.Types.ObjectId[];
}

// Define the Child schema
const ChildSchema: Schema = new Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
    required: true,
  },
  name: { type: String, required: true },
  gender: {
    type: String,
    enum: ["male", "female", "other"], // Enum for gender selection
    required: true,
  },
  schoolName: { type: String, required: true },
  grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
  semester: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  childrenImage: { type: String, default: null }, // Optional child image field
  subscriptions: [{ type: String }],
  progress: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Progress' }]
});

// Export the model
export const Child = mongoose.model<ChildDocument>("Child", ChildSchema);
