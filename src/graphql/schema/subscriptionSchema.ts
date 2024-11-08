import { gql } from "graphql-tag";

export const subscriptionSchema = gql`
  # Input type for createOrder mutation
  input CreateOrderInput {
    region: ID!
    grade: ID!
    semester: String!
    amount: String!
  }

  # Input type for confirmPayment mutation
  input ConfirmPaymentInput {
    razorpay_payment_id: String!
    razorpay_payment_link_id: String!
    razorpay_payment_link_reference_id: String!
    razorpay_payment_link_status: String!
    razorpay_signature: String!
    region: ID!
    grade: ID!
    semester: String!
    childId: ID!
  }

  type Order {
    orderId: String!
    amount: Int!
    currency: String!
    receipt: String!
    link: String!
  }

  type PurchaseDetails {
    success: Boolean!
    message: String!
    purchase: Purchase!
    progressId: ID!
  }

  type Purchase {
    orderId: String!
    region: ID!
    grade: ID!
    semester: String!
    parentId: ID!
    childId: ID!
  }

  type semamt {
    semester: String
    amount: String
  }
  type subPage {
    grade: String
    semesters: [semamt]
  }
  type SubPageResponse {
    success: Boolean!
    message: String!
    data: [subPage]
  }
  type Mutation {
    # Use CreateOrderInput for createOrder mutation
    createOrder(input: CreateOrderInput!): Order

    # Use ConfirmPaymentInput for confirmPayment mutation
    confirmPayment(input: ConfirmPaymentInput!): PurchaseDetails
  }
  type Query {
    subscriptionPage: SubPageResponse!
  }
`;
