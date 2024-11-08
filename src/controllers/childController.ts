import { v4 as uuidv4 } from "uuid";
import { Response } from "express";
import { qraphQlCustomRequest } from "../types/customRequest";
import { Child } from "../models/child";
import { deleteS3Object } from "../utils/deleteS3Object";
import { multipartUpload } from "../utils/multipartUpload";


// Upload Children Image
export const uploadChildImage = async (req: qraphQlCustomRequest, res: Response) => {
    try {
        const { childId } = req.params;
        const file = req.file;
    
        // Check if the user is authenticated
        if (!req.user) {
          return res.status(401).json({ message: "User is not authenticated" });
        }
    
        // Find the child and check if it belongs to the authenticated parent
        const child = await Child.findById(childId);
        if (!child || child.parent.toString() !== req.user.id.toString()) {
          return res.status(403).json({ message: "Child not found or unauthorized" });
        }
    
        // If no file is uploaded, remove the current image
        if (!file) {
          if (child.childrenImage) {
            // If there is an existing image, delete it from S3
            await deleteS3Object(child.childrenImage);
            child.childrenImage = null;
            await child.save();
          }
    
          return res.json({ message: "Image removed successfully" });
        }
    
        // Process the new image upload
        const uniqueFileName = `${child.parent}/${child.name}/${uuidv4()}.${file.mimetype.split("/")[1]}`;
    
        // If the child already has an image, delete the old one
        if (child.childrenImage) {
          await deleteS3Object(child.childrenImage);
        }
    
        // Upload new image to S3 using multipart upload
        await multipartUpload(file.buffer, uniqueFileName, file.mimetype);
    
        // Update the child's document with the new image key
        child.childrenImage = uniqueFileName;
        await child.save();
    
        res.json({ message: "Image uploaded successfully", imageKey: uniqueFileName });
      } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error: ", error.message);
            res.status(500).json({ message: "Server error", error: error.message });
          } else {
            console.error("Unknown error: ", error);
            res.status(500).json({ message: "An unknown error occurred" });
          }
      }
  }
