import React from "react";
// We are using standard <img> tags here for compatibility in this environment.

// Image paths
const forgotImage = "/Shrugging.svg";
const paperworkImage = "/paperwork.svg";

// Data objects for the two sections
const featuresData = [
  {
    headline: "Forgotten Details?",
    description:
      "Forgetting key details about past treatments or medications during a crucial appointment.",
    imageSrc: forgotImage,
    imageAlt:
      "Person shrugging with question marks, symbolizing forgotten details",
    reverse: false, // Text Left, Image Right
  },
  {
    headline: "The Burden of Paperwork!",
    description:
      "The endless hassle of carrying, faxing, and managing physical files for yourself and your family.",
    imageSrc: paperworkImage,
    imageAlt: "Man struggling to carry large stack of boxes and papers",
    reverse: true, // Image Left, Text Right
  },
];

const Features: React.FC = () => {
  return (
    <div className="py-16">
      {featuresData.map((feature, index) => {
        // Determine the CSS class for reversing the layout
        const reverseClass = feature.reverse
          ? "md:flex-row-reverse"
          : "md:flex-row";

        return (
          // Outer container: Flex layout, column stack on mobile, uses reverseClass on desktop
          <div
            key={index}
            className={`
    flex flex-col items-center justify-between gap-10
    md:flex-row
    px-10 
    ${reverseClass} 
    w-[80%] mx-auto
   
  `}
          >
            {/* 1. Text Block (70% width on desktop) */}
            <div className="w-full md:w-7/10 text-center md:text-left">
              <h2 className="text-3xl font-adoha font-bold text-gray-800 mb-4 md:text-4xl">
                {feature.headline}
              </h2>
              <p className="text-lg md:w-8/10 font-urbane text-gray-600 leading-relaxed max-w-xl mx-auto md:mx-0">
                {feature.description}
              </p>
            </div>

            {/* 2. Illustration Container (30% width on desktop) */}
            <div className="w-full md:w-3/10 flex justify-center">
              <img
                className="max-w-xs h-auto w-full md:w-auto object-contain"
                src={feature.imageSrc}
                alt={feature.imageAlt}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Features;
