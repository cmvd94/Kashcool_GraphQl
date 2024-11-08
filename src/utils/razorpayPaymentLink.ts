const Razorpay = require("razorpay");
import { Orders } from "razorpay/dist/types/orders";

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createPaymentLink(
  order: Orders.RazorpayOrder,
  name: string,
  email: string,
  phone: string
) {
  try {
    console.log("inside create payment Link");
    console.log(order); // Order details including order ID

    // Create a payment link
    const paymentLinkOptions = {
      amount: order.amount,
      currency: order.currency,
      accept_partial: false,
      reference_id: order.id,
      description: "Payment for Course Purchase",
      customer: {
        name: name,
        email: email,
        contact: phone,
      },
       notify: { // send payment link to respective number and email
           sms: true,
           email: true
      },
      callback_url: "http://localhost:8000/payment/callback", // URL to handle Razorpay's callback after payment
      callback_method: "get",
    };

    const paymentLink = await instance.paymentLink.create(paymentLinkOptions);
    return paymentLink.short_url;
  } catch (error) {
    console.error("Error creating payment link:", error);
  }
}

//createPaymentLink();
