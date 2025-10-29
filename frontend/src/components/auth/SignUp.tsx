"use client";
import { useState } from "react";
import { signupApi } from "../../services/auth.services";
import { UserSignupData } from "@/lib/types";

interface SignUpProps {
  selectedRole: string;
}

const SignUp: React.FC<SignUpProps> = ({ selectedRole }) => {
  const [form, setForm] = useState<UserSignupData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
    accepted_terms: false,
  });

  const handleChange = (e: {
    target: { name: any; value: any; type: any; checked: any };
  }) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFormValues = {
      ...form,
      role: selectedRole.toLowerCase() as "doctor" | "patient" | "insurer",
    };
    const result = await signupApi(finalFormValues);
    // console.log(result);
  };

  return (
    <div className="w-full md:w-3/5 flex justify-center items-center text-[#111]">
      <form
        className="w-full max-w-lg flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        {/* First and Last Name */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex flex-col flex-1">
            <label className="font-semibold mb-1 text-sm">First Name</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              placeholder="First Name"
              className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="font-semibold mb-1 text-sm">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              placeholder="Last Name"
              className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            placeholder="Enter your password"
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Phone No.</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            placeholder="Enter your phone number"
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
            onChange={handleChange}
          />
        </div>

        {/* Terms */}
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="terms"
            name="accepted_terms"
            checked={form.accepted_terms}
            onChange={handleChange}
            className="accent-black w-4 h-4"
          />
          <label htmlFor="terms">
            I agree to the{" "}
            <span className="font-semibold cursor-pointer">
              Terms & Conditions
            </span>
          </label>
        </div>
        {/* Hidden Role Input */}
        <input type="hidden" name="role" value={selectedRole} />

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-black text-white text-lg py-3 rounded-full cursor-pointer transition hover:bg-gray-800"
        >
          Create Account
        </button>
      </form>
    </div>
  );
};

export default SignUp;
