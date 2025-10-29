import React, { useState } from "react";
import { loginApi } from "../../services/auth.services";
import { UserLoginData } from "@/lib/types";

interface SignInProps {
  onClose: () => void;
  onOtpModelOpen: () => void;
  onLoginSuccess: (userData: { user_id: number; identifier: string }) => void;
}
// emailOrPhone
const SignIn: React.FC<SignInProps> = ({
  onClose,
  onOtpModelOpen,
  onLoginSuccess,
}) => {
  const loginDefaultValues = {
    email_or_phone: "",
    password: "",
  };

  const [formValues, setFormValues] = useState(loginDefaultValues);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await loginApi(formValues);
    if (response.status === 202) {
      onClose();
      const { user_id, identifier } = response.data;
      onLoginSuccess({ user_id, identifier });
      onOtpModelOpen();
    } else {
      // Handle error (e.g., show error message)
      console.log("Login failed:", response.status);
    }
  };
  return (
    // .form-container: display: flex; justify-content: center; align-items: center;
    <div className="mx-auto flex justify-center text-[#111] items-center h-full w-3/5 ">
      {/* .signup-form: width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 20px; */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[600px] flex flex-col gap-[20px]"
      >
        {/* Email Form Group */}
        {/* .form-group: display: flex; flex-direction: column; */}
        <div className="flex flex-col">
          {/* label: font-weight: 600; margin-bottom: 6px; */}
          <label className="font-semibold mb-[6px]">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            name="email_or_phone"
            value={formValues.email_or_phone}
            onChange={handleChange}
            // input[type="email"]: padding: 12px 16px; border: 1px solid #bbb; border-radius: 25px; font-size: 14px; outline: none; focus:border-[#333]
            className="py-[12px] px-[16px] border border-[#bbb] rounded-[25px] text-[14px] outline-none focus:border-[#333]"
          />
        </div>

        {/* Password Form Group */}
        {/* .form-group: display: flex; flex-direction: column; */}
        <div className="flex flex-col">
          {/* label: font-weight: 600; margin-bottom: 6px; */}
          <label className="font-semibold mb-[6px]">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            name="password"
            value={formValues.password}
            onChange={handleChange}
            // input[type="password"]: padding: 12px 16px; border: 1px solid #bbb; border-radius: 25px; font-size: 14px; outline: none; focus:border-[#333]
            className="py-[12px] px-[16px] border border-[#bbb] rounded-[25px] text-[14px] outline-none focus:border-[#333]"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          // .submit-btn: background: #000; color: white; font-size: 18px; padding: 14px; border: none; border-radius: 30px; cursor: pointer; transition: 0.3s; hover:background: #333;
          className="bg-black text-white text-[18px] p-[14px] border-none rounded-[30px] cursor-pointer transition-colors duration-300 hover:bg-[#333]"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default SignIn;
