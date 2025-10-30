"use client";

import { useEffect, useState } from "react";
import React from "react"; // Added React import
import { verifyOtpApi } from "../../services/auth.services";
import { useRouter } from "next/navigation";

interface VerifyOtpModelProps {
  onClose: () => void;
  // NOTE: You will likely need to pass the identifier (email/phone) here in a real app
  userData: {
    user_id: number;
    identifier: string; // Email or phone number
  };
}

const RESEND_TIMEOUT_SECONDS = 30;

const VerifyOtpModel: React.FC<VerifyOtpModelProps> = ({
  onClose,
  userData,
}) => {
  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(RESEND_TIMEOUT_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const router = useRouter();

  // Timer Effect
  useEffect(() => {
    // Exit if the timer is 0 or if we're in the process of initial mount/resending
    if (timeLeft <= 0) return;

    // Set up the interval timer
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts or timeLeft changes
    return () => clearInterval(intervalId);
  }, [timeLeft]); // Re-run effect when timeLeft changes

  // Body Scroll Lock Effect
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add API call to /otp/verify here
    console.log(userData, otpCode);
    const response = await verifyOtpApi(
      userData.user_id,
      userData.identifier,
      otpCode
    );
    console.log("OTP Verification Successful:", response.data);
    await router.push("/dashboard");
    // //api call to user details
    // const detailsResponse = await userDetailsApi();

    // return console.log("Current User:", detailsResponse.data);
  };

  const handleResend = async () => {
    if (timeLeft > 0) return; // Prevent double-clicking

    setIsResending(true);
    // TODO: Add API call to /otp/send here
    console.log("Resending code...");

    // Simulate API delay, then reset timer
    setTimeout(() => {
      setIsResending(false);
      setTimeLeft(RESEND_TIMEOUT_SECONDS); // Reset countdown
      console.log("Resend successful.");
    }, 1000);
  };

  const isResendDisabled = timeLeft > 0 || isResending;
  const resendText = isResending ? "Sending..." : "Resend Code";

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white w-[40%] max-w-[400px] h-auto rounded-[10px] p-[30px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center text-[#111]">
          Verify Account
        </h2>
        <p className="text-center text-sm text-gray-600 mb-2">
          A verification code has been sent to your registered Email{" "}
          <span className="font-semibold"></span>.
        </p>
        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-sm text-gray-600">
              Enter 6-Digit Code
            </label>
            <input
              required
              type="tel"
              maxLength={6}
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              className="w-full text-black text-center text-xl tracking-[10px] py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              placeholder="______"
            />
          </div>
          <button
            type="submit"
            className="bg-black text-white text-lg py-3 rounded-full cursor-pointer transition hover:bg-black"
          >
            Verify & Log In
          </button>
        </form>

        {/* RESEND CODE BUTTON AND TIMER */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handleVerify}
            disabled={isResendDisabled}
            className={`text-sm hover:text-black transition-colors ${
              isResendDisabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-500"
            }`}
          >
            {resendText}
          </button>
          {/* Conditional display of the timer */}
          {timeLeft > 0 && (
            <p className="text-sm font-medium text-gray-500">
              Resend available in: {timeLeft}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpModel;
