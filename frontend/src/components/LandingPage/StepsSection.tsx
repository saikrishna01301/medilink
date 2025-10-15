import Image, { StaticImageData } from "next/image";
import step1Image from "../../../public/Layer 5.png";
import step2Image from "../../../public/tc.svg";
import step3Image from "../../../public/step3.png";

type Step = {
  title: string;
  description: string;
  imageSrc: StaticImageData | string;
  imageAlt: string;
  imageClass?: string;
};

const steps: Step[] = [
  {
    title: "1. Consolidate Your History",
    description:
      "Securely link your existing providers or upload your documents with a snap from your phone. Our intelligent platform organizes everything into a clear, chronological timeline.",
    imageSrc: step1Image,
    imageAlt: "Hand holding phone with health data",
    imageClass: "w-[200px] translate-y-[-20%]",
  },
  {
    title: "2. Connect with Confidence",
    description:
      "You are the owner of your health story. Grant and revoke access to specific doctors, specialists, or insurers with a single click. Your consent is paramount.",
    imageSrc: step2Image,
    imageAlt: "Man pointing, controlling data flow",
  },
  {
    title: "3. Share Your History",
    description:
      "Share your complete history for better care, faster appointments, and smoother insurance claims. Empower your care team with the information they need, when they need it.",
    imageSrc: step3Image,
    imageAlt: "Two people connecting a large plug",
    imageClass: "h-[300px] translate-y-[-10%]",
  },
];

const StepsSection: React.FC = () => {
  return (
    <section className="my-24 w-[80%] mx-auto text-center">
      <h2 className="text-4xl md:text-5xl font-adoha font-bold text-gray-800 mb-32">
        Your Health Unified in 3 Simple Steps!
      </h2>
      <div className="flex flex-col md:flex-row justify-center items-start gap-6 md:gap-10 max-w-[1300px] mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col items-center text-center gap-4"
          >
            <h3 className="text-lg md:text-l font-urbane font-bold text-gray-800 mb-2">
              {step.title}
            </h3>
            <div className=" flex justify-center mb-4">
              <div
                className={`relative w-full h-72 md:h-72 ${
                  step.imageClass || ""
                }`}
              >
                <Image
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
            </div>
            <p className="min-h-[220px] -mt-40 max-w-[300px] text-sm md:text-base text-gray-900 p-6 bg-gray-200/30 rounded-xl shadow-md backdrop-blur-sm border border-white/30 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StepsSection;
