export interface createOrderInput {
  region: string
  grade: string;
  semester: string;
  amount: string;
}
/* 
export interface confirmPaymentInput {
  paymentId: string;
  orderId: string;
  signature: string;
  region: string;
  grade: string;
  semester: string;
  childId: string;
}
 */


export interface confirmPaymentInput {
  razorpay_payment_id: string;
  razorpay_payment_link_id: string;
  razorpay_payment_link_reference_id: string;
  razorpay_payment_link_status: string;
  razorpay_signature: string;
  region: string;
  grade: string;
  semester: string;
  childId: string;
}
