"use client";

const SignUp = () => {
  return (
    <div className="w-full md:w-3/5 flex justify-center items-center text-[#111]">
      <form className="w-full max-w-lg flex flex-col gap-5">
        {/* First and Last Name */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex flex-col flex-1">
            <label className="font-semibold mb-1 text-sm">First Name</label>
            <input
              type="text"
              placeholder="First Name"
              className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="font-semibold mb-1 text-sm">Last Name</label>
            <input
              type="text"
              placeholder="Last Name"
              className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1 text-sm">Phone No.</label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            className="px-4 py-3 border border-gray-400 rounded-full text-sm focus:outline-none focus:border-black"
          />
        </div>

        {/* Terms */}
        <div className="flex items-center gap-2 text-sm">
          <input type="checkbox" id="terms" className="accent-black w-4 h-4" />
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
          className="bg-black text-white text-lg py-3 rounded-full cursor-pointer transition hover:bg-gray-800"
        >
          Create Account
        </button>
      </form>
    </div>
  );
};

export default SignUp;
