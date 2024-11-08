import { Child } from "../../../models/child"; // Import Child model
import { MyContext } from "../../apollo"; // Import context type
import { AuthenticationError } from "apollo-server-errors";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../../../config/s3Client";


export const childQueryResolvers = {
  Query: {
    getAllChildren: async (_parent: any, __: any, { req }: MyContext) => {
      // Validating Token is avalable
      if (!req.user) {
        throw new Error("User is not authenticated");
      }
      const userId = req.user?.id; // Assuming req.user contains the authenticated user details

      try {
        // Fetch all children related to the authenticated parent
        // Fetch all children for the authenticated parent and populate the 'grade' field
        const children = await Child.find({ parent: userId })
          .populate({
            path: "grade", // Path to populate
            select: "grade", // Only retrieve the 'gradeName' field
          })
          .exec();

        return children;
      } catch (error) {
        // Type assertion for the error as 'Error' to access 'message' property
        if (error instanceof Error) {
          throw new Error(`Failed to retrieve children: ${error.message}`);
        } else {
          throw new Error("An unknown error occurred.");
        }
      }
    },
  },

  Child: {
    childrenImage: async (parent: any, _args: any, _context: MyContext) => {
      //console.log("inside children image", parent.childrenImage);

      try {
        // Generate a signed URL for the child's image in S3
        if (parent.childrenImage) {
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
            Key: parent.childrenImage, // The image key from the child document
          });

          // Get the signed URL with a specified expiration time
          const signedUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600,
          }); // URL expires in 1 hour
          return signedUrl;
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to generate signed URL: ${error.message}`);
        } else {
          throw new Error("An unknown error occurred.");
        }
      }
    },
  },
};
