import React, { useState } from "react";
import { authAPI, APIError } from "@/services/api";
import { useAuth, User } from "@/contexts/AuthContext";

interface SignInProps {
  onSuccess?: (user: User) => void;
}

const SignIn: React.FC<SignInProps> = ({ onSuccess }) => {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loginData, setLoginData] = useState<{
    userId: number;
    identifier: string;
  } | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // 2FA DISABLED: Login now directly returns tokens
      const response = await authAPI.login({
        email_or_phone: email,
        password: password,
      });

      // Success - tokens are stored in cookies
      setError(null);

      // Fetch current user data
      try {
        const userData = await authAPI.getCurrentUser();
        
        // Map role to include pharmacist
        let role: "doctor" | "patient" | "insurer" | "pharmacist" = "patient";
        const userRole = userData.role.toLowerCase();
        if (userRole === "doctor") role = "doctor";
        else if (userRole === "insurer") role = "insurer";
        else if (userRole === "patient") role = "patient";
        else if (userRole === "pharmacist" || userRole === "pharmasist") role = "pharmacist";
        
        const user: User = {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          role: role,
        };
        
        // Store user in context
        setUser(user);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(user);
        }
      } catch (fetchError) {
        console.error("Failed to fetch user data:", fetchError);
        // Even if fetch fails, still call onSuccess since login was successful
        if (onSuccess) {
          const user: User = {
            id: response.user_id,
            first_name: "",
            last_name: "",
            email: email,
            phone: "",
            role: "patient",
          };
          onSuccess(user);
        }
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!loginData) {
      setError("Login data not found. Please try again.");
      return;
    }

    setLoading(true);

    try {
      await authAPI.verifyOTP({
        user_id: loginData.userId,
        identifier: loginData.identifier,
        otp_code: otp,
      });

      // Success - tokens are stored in cookies
      setError(null);

      // Fetch current user data
      try {
        const userData = await authAPI.getCurrentUser();
        
        // Map role to include pharmacist
        let role: "doctor" | "patient" | "insurer" | "pharmacist" = "patient";
        const userRole = userData.role.toLowerCase();
        if (userRole === "doctor") role = "doctor";
        else if (userRole === "insurer") role = "insurer";
        else if (userRole === "patient") role = "patient";
        else if (userRole === "pharmacist" || userRole === "pharmasist") role = "pharmacist";
        
        const user: User = {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          role: role,
        };
        
        // Store user in context
        setUser(user);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(user);
        }
      } catch (fetchError) {
        console.error("Failed to fetch user data:", fetchError);
        // Even if fetch fails, still call onSuccess since OTP was verified
        if (onSuccess) {
          // Create a basic user object with available data
          const user: User = {
            id: loginData.userId,
            first_name: "",
            last_name: "",
            email: loginData.identifier,
            phone: "",
            role: "patient",
          };
          onSuccess(user);
        }
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOtpInput(false);
    setOtp("");
    setLoginData(null);
    setError(null);
  };

  return (
    <div className="flex justify-center text-[#111] items-center h-full w-3/5">
      {!showOtpInput ? (
        // Login Form
        <form
          onSubmit={handleLoginSubmit}
          className="w-full max-w-[600px] flex flex-col gap-[20px]"
        >
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Email Form Group */}
          <div className="flex flex-col">
            <label className="font-semibold mb-[6px]">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="py-[12px] px-[16px] border border-[#bbb] rounded-[25px] text-[14px] outline-none focus:border-[#333] disabled:opacity-50"
            />
          </div>

          {/* Password Form Group */}
          <div className="flex flex-col">
            <label className="font-semibold mb-[6px]">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="py-[12px] px-[16px] border border-[#bbb] rounded-[25px] text-[14px] outline-none focus:border-[#333] disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white text-[18px] p-[14px] border-none rounded-[30px] cursor-pointer transition-colors duration-300 hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      ) : (
        // OTP Verification Form
        <form
          onSubmit={handleOtpSubmit}
          className="w-full max-w-[600px] flex flex-col gap-[20px]"
        >
          {/* Info Message */}
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg text-sm">
            An OTP has been sent to your email. Please enter it below to
            complete sign in.
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* OTP Form Group */}
          <div className="flex flex-col">
            <label className="font-semibold mb-[6px]">Enter OTP</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                // Only allow numbers and max 6 digits
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              disabled={loading}
              maxLength={6}
              className="py-[12px] px-[16px] border border-[#bbb] rounded-[25px] text-[14px] outline-none focus:border-[#333] disabled:opacity-50 text-center text-2xl tracking-widest"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-[10px]">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white text-[18px] p-[14px] border-none rounded-[30px] cursor-pointer transition-colors duration-300 hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={loading}
              className="bg-gray-200 text-gray-700 text-[16px] p-[12px] border-none rounded-[30px] cursor-pointer transition-colors duration-300 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SignIn;
