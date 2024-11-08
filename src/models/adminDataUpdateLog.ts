import mongoose, { Schema, Document } from 'mongoose';

export interface UpdateLogDocument extends Document {
  region: mongoose.Schema.Types.ObjectId;
  grade: mongoose.Schema.Types.ObjectId;
  semester: string;
  updatedAt: Date;
}

const updateLogSchema = new Schema<UpdateLogDocument>({
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
  semester: { type: String, required: true },  // Could also be a number if needed
}, { 
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Ensure uniqueness for region, grade, and semester combination
updateLogSchema.index({ region: 1, grade: 1, semester: 1 }, { unique: true });

export const UpdateAdminDataEntryLog = mongoose.model<UpdateLogDocument>('UpdateAdminDataEntryLog', updateLogSchema);


