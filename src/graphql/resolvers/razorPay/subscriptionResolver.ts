import { MyContext } from "../../apollo";
import { confirmPaymentInput } from "../../../types/razorpayInput";
import { PurchaseModel } from "../../../models/purchase";
import { verifyPayment } from "../../../utils/verifyPayment";
import { Child } from "../../../models/child";
import { createOrderInput } from "../../../types/razorpayInput";
import { razorpayCreateOrder } from "../../../config/razorPay";
import { Amount } from "../../../models/amount";
import { initializeProgress } from "../../../utils/initializeProgress";

import { createPaymentLink } from "../../../utils/razorpayPaymentLink";
import { Parent } from "../../../models/parent";

export const subscriptionResolver = {
  Query: {
    subscriptionPage: async (_: any, __: any, { req }: MyContext) => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        // Get the region from the authenticated user's information
        const userRegion = req.user.region;
        if (!userRegion) {
          throw new Error("User's region not found");
        }

        // Find all amounts associated with the user's region
        const amounts = await Amount.find({ region: userRegion }).populate(
          "grade"
        ); // Populate grade name
        console.log(amounts);

        // Check if any amounts were found
        if (!amounts || amounts.length === 0) {
          return {
            success: false,
            message: "No subscription information found for the user's region.",
            data: [],
          };
        }

        // Return the amounts found for the user's region
        return {
          success: true,
          message: "Subscription information retrieved successfully.",
          data: amounts.map((amount) => ({
            grade: (amount.grade as any)?.grade,
            semesters: amount.semesters,
          })),
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(
            `Error fetching subscription information: ${err.message}`
          );
        }
        throw new Error("An unknown error occurred");
      }
    },
  },
  Mutation: {
    // create order is not necessary.
    createOrder: async (
      _: any,
      { input }: { input: createOrderInput },
      { req }: MyContext
    ) => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        // Create Razorpay order
        const order = await razorpayCreateOrder(input, req.user?.id.toString());
        if (!order) {
          throw new Error("new order not create");
        }

        const user = await Parent.findOne({
          _id: req.user.id,
          region: req.user.region,
        });

        if (!user) {
          throw new Error("user not found");
        }

        const link = createPaymentLink(
          order,
          user?.name,
          user?.email,
          user?.phone
        );

        return {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          link: link,
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error create razorpay order: ${err.message}`);
        }
        throw new Error("Unknown error occurred");
      }
    },
    confirmPayment: async (
      _: any,
      { input }: { input: confirmPaymentInput },
      { req }: MyContext
    ) => {
      try {
        const {
          razorpay_payment_id,
          razorpay_payment_link_id,
          razorpay_payment_link_reference_id,
          razorpay_payment_link_status,
          razorpay_signature,
          region,
          grade,
          semester,
          childId,
        } = input;

        if (!req.user) {
          throw new Error("User is not authenticated");
        }

        const razorPaySecretKey = process.env.RAZORPAY_KEY_SECRET!;

        // Verify the payment
        const isValid = verifyPayment(
          razorpay_payment_id,
          razorpay_payment_link_id,
          razorpay_payment_link_reference_id,
          razorpay_payment_link_status,
          razorpay_signature,
          razorPaySecretKey
        );

        if (!isValid) {
          throw new Error("Payment verification failed");
        }

        // Store purchase details in the database
        const parentId = req.user.id;
        const purchase = new PurchaseModel({
          orderId: razorpay_payment_link_reference_id,
          region,
          grade,
          semester,
          parentId,
          childId,
        });
        await purchase.save();

        // Generate the subscription key
        const subkey =
          region.toString() + grade.toString() + semester.toString();

        // Find the child by childId
        const child = await Child.findById(childId);

        if (!child) {
          throw new Error("Child not found");
        }

        // Add the subscription key to the child's subscriptions array
        if (!child.subscriptions.includes(subkey)) {
          child.subscriptions.push(subkey);
        }

        // Save the updated child document
        await child.save();

        // Initialize progress for the child after payment confirmation
        const progress = await initializeProgress(
          childId,
          region,
          grade,
          semester
        );

        return {
          success: true,
          message:
            "Payment successful, subscription added, progress initialized, and purchase stored",
          purchase,
          progressId: progress, // Return the progress ID
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Error verifying Razorpay payment: ${err.message}`);
        }
        throw new Error("Unknown error occurred");
      }
    },
  },
};
