import { AuthenticationError } from "apollo-server-errors";
import mongoose from "mongoose";

import { Child, ChildDocument } from "../../../models/child"; // Import Child model
import { Parent } from "../../../models/parent"; // Import Parent model
import { MyContext } from "../../apollo"; // Import context type
import { AddChildInput } from "../../../types/userInput";
import { deleteS3Object } from "../../../utils/deleteS3Object";

export const childMutationResolvers = {

  Mutation: {
    addChild: async (
      _: any,
      { input }: { input: AddChildInput }, // Use the input type here
      { req }: MyContext // Get request object from context
    ) => {
      if (!req.user) {
        throw new Error("User is not authenticated");
      }
      const userId = req.user?.id; // Assuming req.user contains the authenticated user details
      const { name, gender, schoolName, dateOfBirth, grade, semester } = input;

      // Create a new child document
      const newChild = new Child({
        parent: userId,
        name,
        gender,
        schoolName,
        dateOfBirth,
        grade,
        semester,
        childrenImage: null,
        subscriptions: [],
        // Spread the input fields into the new Child document
      });

      try {
        // Save the new child to the database
        const savedChild = await newChild.save();

        // Find the parent and update their children array
        const parent = await Parent.findById(userId);
        if (!parent) {
          throw new Error("Parent not found.");
        }

        // Add child ID to the parent's children array
        parent.children.push(savedChild._id as mongoose.Schema.Types.ObjectId);

        // If it's the first child being added, set as default child
        if (parent.defaultChild === null) {
          parent.defaultChild =
            savedChild._id as mongoose.Schema.Types.ObjectId;
        }

        // Save the updated parent document
        await parent.save();

        return {
          message: " Children created Successfully",
        }; // Return the saved child document
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to add child: ${error.message}`);
        } else {
          throw new Error("An unknown error occurred.");
        }
      }
    },

    // Add the updateChild mutation resolver
    updateChild: async (
      _: any,
      { childId, input }: { childId: string; input: AddChildInput },
      { req }: MyContext
    ) => {
      if (!req.user) {
        throw new AuthenticationError("User is not authenticated");
      }

      const userId = req.user?.id; // Assuming req.user contains the authenticated user details
      const { name, gender, schoolName, dateOfBirth, grade, semester } = input;

      try {
        // Find the child by its ID and ensure the child belongs to the authenticated user
        const child = await Child.findOne({ _id: childId, parent: userId });

        if (!child) {
          throw new Error("Child not found or not authorized to update");
        }

        // Update child fields
        if (name) child.name = name;
        if (gender) child.gender = gender;
        if (schoolName) child.schoolName = schoolName;
        if (dateOfBirth) child.dateOfBirth = new Date(dateOfBirth);
        if (grade) child.grade = grade;
        if (semester) child.semester = semester;

        // Save the updated child document
        await child.save();

        return {
          message: "Child updated successfully",
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to update child: ${error.message}`);
        } else {
          throw new Error("An unknown error occurred.");
        }
      }
    },

    /* // Delete Child
    deleteChild: async (
      _: any,
      { childId }: { childId: string },
      { req }: MyContext
    ) => {
      // Check if user is authenticated
      if (!req.user) {
        throw new Error("User is not authenticated");
      }

      const userId = req.user?.id; // Get the authenticated user's ID

      try {
        // Find the child by ID and verify if it belongs to the parent
        const child = await Child.findById(childId);
        if (!child || child.parent.toString() !== userId.toString()) {
          throw new Error("Child not found or unauthorized");
        }

        // Find the parent associated with this child
        const parent = await Parent.findById(userId);
        if (!parent) {
          throw new Error("Parent not found.");
        }

        // If the child has an image, delete it from S3
        if (child.childrenImage) {
          await deleteS3Object(child.childrenImage);
        }

        // Remove the child from the parent's children array
        parent.children = parent.children.filter(
          (childObjId) => childObjId.toString() !== childId.toString()
        );

        // If the deleted child was the default child, assign the next child as default
        if (parent.defaultChild && parent.defaultChild.toString() === childId.toString()) {
          parent.defaultChild = parent.children.length > 0 ? parent.children[0] : null;
        }

        // Save the updated parent document
        await parent.save();

        // Finally, delete the child document
        await Child.findByIdAndDelete(childId);

        return {
          message: "Child deleted successfully",
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to delete child: ${error.message}`);
        } else {
          throw new Error("An unknown error occurred.");
        }
      }
    }, */
  },
};
