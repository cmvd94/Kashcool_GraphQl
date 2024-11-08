import mongoose, { Document } from "mongoose";

// Define the interface for SemesterAmount
export interface SemesterAmount {
    semester: string;  // Name of the semester (e.g., "Fall 2024")
    amount: number;    // Amount for the semester (e.g., 100, 200)
}

// Define the interface for AmountDocument
export interface AmountDocument extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    region: mongoose.Schema.Types.ObjectId; // Reference to Region model
    grade: mongoose.Schema.Types.ObjectId;  // Reference to Grade model
    semesters: SemesterAmount[];            // Array of semester and amount objects
}

// Define the Amount schema
const amountSchema = new mongoose.Schema<AmountDocument>({
    region: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Region", 
        required: true 
    }, // Reference to Region model
    grade: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Grade", 
        required: true 
    },   // Reference to Grade model
    semesters: [
        {
            semester: { type: String, required: true },  // Semester name
            amount: { type: Number, required: true }     // Amount for the semester
        }
    ]
});

// Export the Amount model
export const Amount = mongoose.model<AmountDocument>("Amount", amountSchema);
