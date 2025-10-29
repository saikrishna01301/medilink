import API from "@/lib/axios";
import { UserSignupData, UserLoginData } from "@/lib/types";

export const signupApi = async (user: UserSignupData) => {
  const response = await API.post("/auth/signup", user);
  return response;
};

export const loginApi = async (userCredentials: UserLoginData) => {
  const response = await API.post("/auth/login", userCredentials);
  return response;
};

export const verifyOtpApi = async (
  user_id: number,
  identifier: string,
  otp_code: string
) => {
  const response = await API.post("/auth/verify-account", {
    user_id,
    identifier,
    otp_code,
  });
  return response;
};
