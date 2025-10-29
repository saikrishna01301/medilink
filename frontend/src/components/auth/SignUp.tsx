"use client";

import { useState } from "react";
import { authAPI, APIError } from "@/services/api";

interface SignUpProps {
  selectedRole: string;
  onSuccess?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ selectedRole, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    acceptedTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError("Valid phone number is required (at least 10 digits)");
      return false;
    }
    if (!formData.acceptedTerms) {
      setError("You must accept the Terms & Conditions");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    // Map the selected role to backend format
    let role: "doctor" | "patient" | "insurer" = "patient";
    if (selectedRole.toLowerCase() === "doctor") role = "doctor";
    else if (selectedRole.toLowerCase() === "insurer") role = "insurer";
    else if (selectedRole.toLowerCase() === "patient") role = "patient";
    // Default to patient for "Pharmasist" or any other role

    setLoading(true);

    try {
      const response = await authAPI.signUp({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role,
        accepted_terms: formData.acceptedTerms,
      });

      setSuccess(true);
      setError(null);
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        acceptedTerms: false,
      });

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Sign up error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-3/5 flex justify-center items-center text-[#111]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-5"
      >
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
            Account created successfully! You can now sign in.
          </div>
        )}

        {/* First and Last Name */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex flex-col flex-1">
            <label className="font-semibold mb-1 text-sm">First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={loading}
              className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="font-semibold mb-1 text-sm">Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={loading}
              className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black disabled:opacity-50"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black disabled:opacity-50"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password (min 8 characters)"
            value={formData.password}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black disabled:opacity-50"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Phone No.</label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black disabled:opacity-50"
          />
        </div>

        {/* Terms */}
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptedTerms"
            id="terms"
            checked={formData.acceptedTerms}
            onChange={handleInputChange}
            disabled={loading}
            className="accent-black w-4 h-4 disabled:opacity-50"
          />
          <label htmlFor="terms">
            I agree to the{" "}
            <span className="font-semibold cursor-pointer">
              Terms & Conditions
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white text-lg py-3 rounded-full cursor-pointer transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
