"use client";

import React from "react";

// --- 1. Typescript Interface for Testimonial Data ---
interface Testimonial {
  quote: string;
  name: string;
  handle: string;
  avatar: string; // Using string for placeholder image URL
}

// --- 2. Mock Data (Replaced imported image with a placeholder URL) ---
// Using a random placeholder image URL for the avatar
const placeholderAvatar = "/Avatar.jpg";

const baseTestimonial: Testimonial = {
  quote:
    "The progress tracker is fantastic, Team - 2 is wonderful, they have made an excellent platform, definitely deserve an A+ grade for this project!",
  name: "First Person",
  handle: "@krishh.threads",
  avatar: placeholderAvatar,
};

const testimonialsData: Testimonial[] = [
  baseTestimonial,
  {
    ...baseTestimonial,
    name: "Jane Doe",
    handle: "@janedoe_dev",
    avatar: "https://placehold.co/40x40/F59E0B/ffffff?text=JD",
  },
  {
    ...baseTestimonial,
    name: "Alex Smith",
    handle: "@alex_smith",
    avatar: "https://placehold.co/40x40/3B82F6/ffffff?text=AS",
  },
  {
    ...baseTestimonial,
    name: "Chris Lee",
    handle: "@chris_codes",
    avatar: "https://placehold.co/40x40/EF4444/ffffff?text=CL",
  },
  {
    ...baseTestimonial,
    name: "Alex Smith",
    handle: "@alex_smith",
    avatar: "https://placehold.co/40x40/3B82F6/ffffff?text=AS",
  },
  {
    ...baseTestimonial,
    name: "Chris Lee",
    handle: "@chris_codes",
    avatar: "https://placehold.co/40x40/EF4444/ffffff?text=CL",
  },
];

// --- 3. Testimonials Component ---

const Testimonials: React.FC = () => {
  return (
    <section className="font-sans w-[80%] mx-auto mt-25">
      {/* Header and Subtitle */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-medium text-[#333333] mb-16 text-center font-adoha">
          Our Happy Customers
        </h2>

        {/* Grid of Testimonial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonialsData.map((t, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl text-left shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
            >
              {/* Quote Icon (Using a custom class to mimic the original font style/size) */}
              <span className="text-6xl text-gray-200 font-serif leading-none block mb-6">
                “
              </span>

              <p className="text-base leading-relaxed text-gray-600 mb-8 min-h-[100px]">
                {t.quote}
              </p>

              {/* User Info and Avatar */}
              <div className="flex items-center mt-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover mr-4 ring-2 ring-blue-500/20"
                  // Optional: Use onError to handle broken links
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/40x40/cccccc/000000?text=ERR";
                  }}
                />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-[#333333] m-0">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-500 m-0">{t.handle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
