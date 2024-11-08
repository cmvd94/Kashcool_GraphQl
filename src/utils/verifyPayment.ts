import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
export const verifyPayment = (
  razorpay_payment_id: string,
  razorpay_payment_link_id: string,
  razorpay_payment_link_reference_id: string,
  razorpay_payment_link_status: string,
  razorpay_signature: string,

  keySecret: string
) => {
  const verify = validatePaymentVerification(
    {
      payment_link_id: razorpay_payment_link_id,
      payment_id: razorpay_payment_id,
      payment_link_reference_id: razorpay_payment_link_reference_id,
      payment_link_status: razorpay_payment_link_status,
    },
    razorpay_signature,
    keySecret
  );

  console.log(verify);
  /*     console.log(razorpayOrderId,razorpayPaymentId)

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    //   const generated_signature = hmac_sha256(razorpayOrderId + "|" + razorpayPaymentId, keySecret);
     const generated_signature = CryptoJS.HmacSHA256(razorpayOrderId + "|" + razorpayPaymentId, keySecret).toString(CryptoJS.enc.Hex);
     const genSign = validatePaymentVerification({order_id: razorpayOrderId, payment_id: razorpayOrderId}, razorpaySignature, keySecret)
     console.log("generated sign:",generated_signature)
     console.log(genSign)

  if (genSign) {
    console.log("payment is successful")
  }else{
    console.log("fails")
  }
      console.log("generatedSign:",generatedSignature)
    return generatedSignature === razorpaySignature;
 */

  return verify;
};
