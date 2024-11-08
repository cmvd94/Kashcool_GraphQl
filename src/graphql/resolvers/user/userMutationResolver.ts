import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  UserInputError,
  ApolloError,
} from "apollo-server-errors";

import { Parent } from "../../../models/parent"; // Import the Parent model
import { Region } from "../../../models/region";
import { redisClient } from "../../../config/redisDbTTL"; // Redis client for OTP
import { sendOTP } from "../../../utils/sendotp"; // Import your OTP service utility
import { sendEmail } from "../../../utils/emailHelper";
import { cleanUpExpiredTokens } from "../../../utils/tokenCleanup";
import { isEmail } from "../../../utils/isEmail";
import { qraphQlCustomRequest } from "../../../types/customRequest";
import { clearUserTokens } from "../../../utils/clearUserToken";
import {
  RegisterUserInput,
  VerifyOTPInput,
  ChangePasswordInput,
} from "../../../types/userInput";

const TOKEN_EXPIRATION = 30 * 24 * 60 * 60; // 30 days in seconds
const MAX_DEVICES = 3;
const MAX_ATTEMPTS = 5; // Maximum login attempts allowed
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes lockout

// User Input

export const userMutationResolver = {
  Mutation: {
    // user registration
    registerUser: async (_: any, { input }: { input: RegisterUserInput }) => {
      const {
        name,
        email,
        password,
        confirmPassword,
        phone,
        gender,
        region,
        dateOfBirth,
      } = input;

      try {
        if (!phone) throw new Error("enter valid phone number");

        const reg = await Region.findOne({ regionName: region });
        if (!reg) throw new Error("Region not found");

        const existingParent = await Parent.findOne({
          $or: [{ email }, { phone }],
        });
        if (existingParent) throw new Error("Email or phone already in use");

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpKey = `otp:${phone}`;

        await redisClient.setEx(
          otpKey,
          300,
          JSON.stringify({
            otp: otp.toString(),
            name,
            email,
            phone,
            gender,
            region: reg._id,
            dateOfBirth,
            password,
          })
        );

        await sendOTP(phone, otp);

        return {
          message: "OTP sent to phone. Please verify to complete registration.",
          otpKey,
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error generating OTP: ${err.message}`);
        }
        throw new Error("Unknown error occurred");
      }
    },

    // register otp verification
    verifyOTP: async (_: any, { input }: { input: VerifyOTPInput }) => {
      const { otp, otpKey } = input; // Extract the OTP and OTP key from input
      console.log(otp, otpKey);
      console.log(typeof otp);
      // Ensure otpKey is valid before proceeding
      if (!otpKey) {
        return {
          success: false,
          message: "OTP-key is missing or invalid.",
        };
      }

      try {
        // Retrieve user data and OTP from Redis using the otpKey
        const storedData = await redisClient.get(otpKey);
        if (!storedData) {
          return {
            success: false,
            message: "OTP expired or invalid. Please try again.",
          };
        }

        const {
          otp: storedOTP,
          name,
          email,
          phone,
          gender,
          region,
          dateOfBirth,
          password,
        } = JSON.parse(storedData);

        // Check if OTP matches
        if (storedOTP !== otp) {
          return {
            success: false,
            message: "Invalid OTP",
          };
        }

        // Create new user if OTP is valid
        const newParent = new Parent({
          name,
          email,
          password, // No need to hash the password, handled in the pre-save middleware
          phone,
          gender,
          region,
          dateOfBirth: new Date(dateOfBirth),
          defaultChild: null, // Can be set later
          children: [], // Empty list initially
        });

        // Save the new user in the database
        await newParent.save();

        // Compose and send email confirmation
        const emailContent = {
          to: email,
          name,
          subject: "Account Created Successfully",
          text: `Hello ${name},\n\nYour account has been created successfully!\n\nBest regards,\nYour Team`,
          html: `<strong>Hello ${name},</strong><br><p>Your account has been created successfully!</p><p>Best regards,<br>Your Team</p>`,
        };

        await sendEmail(emailContent); // Send the email

        // Delete the OTP and user data from Redis after successful verification
        await redisClient.del(otpKey);

        // Return success response
        return {
          success: true,
          message: "User registered successfully.",
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          return {
            success: false,
            message: `Error verifying OTP: ${err.message}`,
          };
        }

        return {
          success: false,
          message: "Unknown error occurred",
        };
      }
    },

    // User Login
    async userLogin(
      _: any,
      { input, password }: { input: string; password: string }
    ) {
      try {
        const query = isEmail(input)
          ? { email: input.toLowerCase() }
          : { phone: input };
        const parent = await Parent.findOne(query);

        if (!parent) {
          throw new UserInputError("Parent not found");
        }

        // Check if the account is locked
        if (parent.lockUntil && new Date() < parent.lockUntil) {
          throw new AuthenticationError(
            `Account locked. Try again after ${parent.lockUntil.toLocaleString()}`
          );
        }

        const passwordMatch = await parent.comparePassword(password);
        if (!passwordMatch) {
          parent.loginAttempts += 1;

          if (parent.loginAttempts >= MAX_ATTEMPTS) {
            parent.lockUntil = new Date(Date.now() + LOCKOUT_TIME);
            await parent.save();
            throw new AuthenticationError(
              "Too many failed attempts. Account locked for 30 minutes."
            );
          }

          await parent.save();
          throw new AuthenticationError("Password Incorrect");
        }

        // Reset login attempts after successful login
        parent.loginAttempts = 0;
        parent.lockUntil = null;
        await parent.save();

        // Generate token
        const jwtSecret = process.env.JWT_SECRET_KEY;
        if (!jwtSecret) {
          throw new Error("JWT secret is missing");
        }

        // Clean up expired tokens
        const tokenSetKey = `parentTokens:${parent._id.toString()}`;
        await cleanUpExpiredTokens(parent, "parentTokens");

        // Check the number of existing active tokens (devices)
        const existingTokens = await redisClient.sMembers(tokenSetKey);
        const currentActiveTokensCount = existingTokens.length;

        if (currentActiveTokensCount >= MAX_DEVICES) {
          throw new AuthenticationError(
            "Maximum login limit reached. Please log out from another device to continue."
          );
        }

        // Create a new token
        // authUser is used for graphql middleware.
        const token = jwt.sign(
          { id: parent._id, authUser: "client" },
          jwtSecret,
          { expiresIn: "30d" }
        );
        const tokenKey = `jwtToken:${parent._id.toString()}:${token}`;
        await redisClient.set(tokenKey, token, { EX: TOKEN_EXPIRATION }); // 30 days

        // Add the new token to Redis
        await redisClient.sAdd(tokenSetKey, tokenKey);

        // Return the token and other relevant data
        return {
          token,
          region: parent.region,
          defaultChild: parent.defaultChild,
        };
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(err.message || "Error logging in");
        } else {
          throw new Error("Unknown error occurred");
        }
      }
    },

    
    // User Logout Single device
    async logout(_: any, __: any, context: { req: qraphQlCustomRequest }) {
      const token = context.req.headers.authorization?.split(" ")[1]; // Assuming Bearer token
      if (!token) {
        throw new AuthenticationError("No token provided");
      }

      const { req } = context;
      if (!req.user) {
        throw new Error("User is not authenticated");
      }

      const tokenKey = `jwtToken:${req.user.id}:${token}`; // Construct the token key
      const tokenSetKey = `parentTokens:${req.user.id}`; // User's token set key

      try {
        // Remove the token from Redis
        await redisClient.del(tokenKey);

        // Remove the token from the user's set of active tokens
        await redisClient.sRem(tokenSetKey, tokenKey);

        return {
          message: "Successfully logged out from this device",
        };
      } catch (error) {
        console.error("Error during logout:", error);
        throw new ApolloError("Error logging out");
      }
    },

    // Logout all device
    async logoutAllDevices(
      _: any,
      __: any,
      context: { req: qraphQlCustomRequest }
    ) {
      try {
        if (!context.req.user) {
          throw new AuthenticationError("User is not authenticated");
        }

        // Clear all tokens for the user
        await clearUserTokens(context.req.user.id.toString());

        return {
          message: "Successfully logged out from all devices",
        };
      } catch (error) {
        console.error("Error during logout from all devices:", error);
        throw new ApolloError("Error logging out from all devices");
      }
    },

    // Change Password in login Page
    async changePasswordBeforeLogin(_: any, { phone }: { phone: string }) {
      try {
        // Find the parent by phone number
        const parent = await Parent.findOne({ phone });
        if (!parent) {
          throw new UserInputError("Parent not found");
        }

        // Generate OTP (random 6-digit number)
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Store OTP in Redis with an expiration time (5 minutes)
        await redisClient.setEx(
          `changepasswordOTP:${phone}`,
          300,
          otp.toString()
        );

        // Send OTP via SMS
        await sendOTP(phone, otp);

        return {
          message: "OTP sent successfully",
        };
      } catch (error) {
        console.error("Error sending OTP:", error);
        throw new ApolloError("Error sending OTP");
      }
    },

    // change password after login and also in login page change password is set here
    async changePassword(
      _: any,
      { input }: { input: ChangePasswordInput },
      context: { req: qraphQlCustomRequest }
    ) {
      const { otp, phone, currentPassword, newPassword } = input;

      try {
        let redisOtpKey;
        // Find parent by phone number (assuming phone is unique)
        const parent = await Parent.findOne({ phone });
        if (!parent) {
          throw new UserInputError("Parent not found.");
        }

        // Case 1: OTP-based password reset (before login)
        if (otp && phone) {
          redisOtpKey = `changepasswordOTP:${phone}`;
          const storedOtp = await redisClient.get(redisOtpKey);

          if (!storedOtp) {
            throw new UserInputError("OTP expired or invalid.");
          }

          if (storedOtp !== otp) {
            throw new UserInputError("Incorrect OTP.");
          }
        } else if (!context.req.user) {
          throw new AuthenticationError("User is not authenticated");
        } else if (context.req.user) {
          // Ensure currentPassword is provided
          if (!currentPassword) {
            throw new UserInputError("Current password is required.");
          }

          // Case 2: Password change after login
          const isMatch = await parent.comparePassword(currentPassword);
          if (!isMatch) {
            throw new UserInputError("Current password is incorrect.");
          }
        } else {
          throw new UserInputError(
            "Either OTP or current password is required for password change."
          );
        }

        // Update password and save
        parent.password = newPassword;
        await parent.save();

        // Send confirmation email
        const emailContent = {
          to: parent.email,
          name: parent.name,
          subject: "Password Changed Successfully",
          text: `Hello ${parent.name},\n\nYour account password changed successfully!\n\nBest regards,\nYour Team`,
          html: `<strong>Hello ${parent.name},</strong><br><p>Your account password has been changed successfully!</p><p>Best regards,<br>Your Team</p>`,
        };

        await sendEmail(emailContent);

        // Clear OTP from Redis (if OTP was used)
        if (redisOtpKey) {
          await redisClient.del(redisOtpKey);
        }

        // Clear user tokens (after login scenario)
        await clearUserTokens(parent._id.toString());

        return {
          message: "Password changed successfully.",
        };
      } catch (error) {
        console.error("Error changing password:", error);

        // Pass the specific error to the client if it's a known error
        if (error instanceof UserInputError || error instanceof AuthenticationError) {
          throw error;
        }
    
        // For unexpected errors, use a more generic ApolloError
        throw new ApolloError("Internal server error while changing password.");
      
      }
    },
  },
};
