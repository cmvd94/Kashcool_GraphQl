import {
  deleteParent,
  deleteChild,
} from "../../../utils/view-user/userDeleteHelper";
import { MyContext } from "../../apollo";
import { Child } from "../../../models/child";
import mongoose from "mongoose";


export const deleteParentChild = {
  Mutation: {
    // Resolver to delete a parent and all their children
    deleteParent: async (
      _: any,
      { parentId }: { parentId: string },
      { req }: MyContext
    ) => {
      try {
        // Check if the user is authenticated
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        // Only allow deletion of own parent data (if required)
        if (req.user.id.toString() !== parentId) {
          throw new Error("Unauthorized to delete this parent");
        }

        // Use the deleteParent helper function
        await deleteParent(req.user.id.toString());

        return {
          success: true,
          message: "Parent and all related data deleted successfully",
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Error deleting parent: ${error.message}`,
          };
        }
        return {
          success: false,
          message: "Unknown error occurred while deleting parent.",
        };
      }
    },

    // Resolver to delete a child
    deleteChild: async (
      _: any,
      { childId }: { childId: string },
      { req }: MyContext
    ) => {
      try {
        // Check if the user is authenticated
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const child = await Child.findById(childId).exec();
        if (!child) {
          throw new Error("Child not found");
        }

        // Ensure the child belongs to the authenticated parent
        if (child.parent.toString() !== req.user.id.toString()) {
          throw new Error("Unauthorized to delete this child");
        }

        // Use the deleteChild helper function
        await deleteChild(childId);

        return {
          success: true,
          message: "Child and all related data deleted successfully",
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Error deleting child: ${error.message}`,
          };
        }
        return {
          success: false,
          message: "Unknown error occurred while deleting child.",
        };
      }
    },
  },
};
