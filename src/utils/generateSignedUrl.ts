import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../config/s3Client";

/**
 * Helper function to generate a signed URL for an S3 object
 * @param {string} key - The S3 object key (file path).
 * @param {number} [expiresIn=3600] - Optional expiration time for the signed URL (in seconds). Default is 1 hour.
 * @returns {Promise<string>} - Returns the signed URL as a string.
 */
//export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {

  // Create the command to get the object
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
    Key: key, // The key or path to the object in the S3 bucket
  });

  // Generate the signed URL
  const signedUrl = await getSignedUrl(s3, command, { expiresIn });

  return signedUrl;
};
