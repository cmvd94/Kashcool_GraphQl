import { gql } from "graphql-tag";

export const userSchema = gql`


  type Sem {
    semesterName: String
  }

  type RegionGrade {
    gradeId: ID!
    gradeName: String!
    sem: [Sem!]! # sem is a list of Sem type objects
  }

  
  type Region {
    _id: ID!
    regionName: String!
    grades: [RegionGrade!]!
  }

  input RegisterUserInput {
    name: String!
    email: String!
    password: String!
    confirmPassword: String!
    phone: String!
    gender: String!
    region: String!
    dateOfBirth: String!
  }

  type RegisterUserResponse {
    message: String!
    otpKey: String!
  }

  input VerifyOTPInput {
    otp: String!
    otpKey: String!
  }

  type VerifyOTPResponse {
    success: Boolean!
    message: String!
  }

  type LoginResponse {
    token: String!
    region: ID
    defaultChild: ID
  }

  type LogoutResponse {
    message: String!
  }

  type LogoutResponse {
    message: String!
  }

  type OTPResponse {
    message: String!
  }

  input ChangePasswordInput {
    otp: String
    phone: String
    currentPassword: String
    newPassword: String!
  }

  type ChangePasswordResponse {
    message: String!
  }

  type Mutation {
    registerUser(input: RegisterUserInput!): RegisterUserResponse
    verifyOTP(input: VerifyOTPInput!): VerifyOTPResponse!
    userLogin(input: String!, password: String!): LoginResponse!
    logout: LogoutResponse!
    logoutAllDevices: LogoutResponse!
    changePasswordBeforeLogin(phone: String!): OTPResponse!
    changePassword(input: ChangePasswordInput!): ChangePasswordResponse!
  }

  type Query {
    allRegions: [Region!]!
  }
`;
