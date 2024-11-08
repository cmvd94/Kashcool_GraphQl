import Razorpay from "razorpay";
import { createOrderInput } from "../types/razorpayInput";
import { Amount } from "../models/amount";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create a new Razorpay order
// if order is created then in frontend directly create paymentLink
export const razorpayCreateOrder = async (
  input: createOrderInput,
  userId: string
) => {
  const { grade, amount, semester } = input;

  const options = {
    amount: +amount! * 100, // Convert amount to paise
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
    payment_capture: 1,
    notes: {
      userId: userId,
      grade: grade,
      semester: semester,
    },
  };
  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
  }
};
