"use client";

import Image from "next/image";
import DashboardImage from "../../../public/image.png"; 

const PlatformIntro: React.FC = () => {
  return (
    <section className="w-[80%] mx-auto flex flex-col items-center text-center ">
      {/* --- 1. Email Subscription/Join Bar --- */}
      <div className="flex w-full max-w-xl mb-6 gap-2">
        <input
          type="email"
          placeholder="enter your e-mail address"
          className="flex-grow px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button className="px-6 py-3 text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm transition hover:bg-gray-100">
          join us today!
        </button>
      </div>

      {/* --- 2. Main Title --- */}
      <h3 className="max-w-3xl mt-12 mb-6 text-3xl font-adoha text-gray-800 md:text-5xl">
        A Single Platform, Built for All of Us.
      </h3>

      {/* --- 2b. Role Toggles --- */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        <button className="px-6 py-2 text-sm font-medium text-gray-800 bg-white rounded-full shadow-md transition hover:bg-gray-100">
          For Doctors
        </button>
        <button className="px-6 py-2 text-sm font-medium text-gray-500 bg-transparent rounded-full transition hover:text-gray-800">
          For Patients
        </button>
        <button className="px-6 py-2 text-sm font-medium text-gray-500 bg-transparent rounded-full transition hover:text-gray-800">
          For Insurers
        </button>
      </div>

      {/* --- 3. Description Text --- */}
      <p className="max-w-3xl mb-12 text-base leading-relaxed font-urbane text-gray-600 md:text-lg">
        Our provider platform is designed to eliminate the clinical blind spots
        caused by fragmented patient data. By consolidating a patient’s entire
        medical history...
      </p>

      {/* --- 4. Dashboard Visual --- */}
      <div className="w-full max-w-6xl rounded-xl shadow-xl overflow-hidden">
        <Image
          src={DashboardImage}
          alt="Picture of how the dashboard looks"
          className="object-cover w-full h-auto rounded-xl"
          priority
        />
      </div>
    </section>
  );
};

export default PlatformIntro;
