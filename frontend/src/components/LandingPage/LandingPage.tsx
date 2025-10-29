"use client";
import Header from "./Header";
import Features from "./Features";
import Testimonials from "./Testimonials";
import StepsSection from "./StepsSection";
import PlatformIntro from "./PlatformIntro";
import Footer from "./Footer";
import AuthModal from "../auth/AuthModal";
import { useState } from "react";

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const onOpenAuthModal = () => {
    setShowAuthModal(true);
  };
  const onCloseAuthModal = () => {
    setShowAuthModal(false);
  };
  return (
    <>
      <div className=" max-w-[1288px] w-4/5 mx-auto min-h-[160vh]  bg-[url('/bg-gradient.svg')] bg-contain bg-top bg-no-repeat">
        <Header onOpenAuthModal={onOpenAuthModal} />
        <div className="w-[90%] mx-auto mt-10">
          <p className=" font-adoha  md:text-[3.5rem] text-black text-center">
            Your Complete Health History
            <br />
            Secure, Simple & All in One Place!
          </p>
          <p className="m-15 z-20 font-urbane  text-1xl text-black text-center">
            Stop Chasing paper records and fumbling with files.
            <br />
            MediHealth Brings your medical history, prescription, and tests
            results
            <br />
            together connecting you seamlessly with your doctors and insurer.
          </p>
          <div className="flex-container width-1230 flex justify-between items-center p-4">
            {/* Item 1: The Image */}
            <img
              className=""
              src="/Asset2.svg"
              alt="Healthcare illustration"
              width={532}
              style={{ marginLeft: "-90px", transform: "scaleX(-1)" }} // Removed the negative margin for now
            />

            {/* Item 2: The Text Container */}
            <div className="text-content  max-w-[600px]">
              <p className="font-adoha width-600 text-4xl text-black text-center">
                Tired of Scattered Healthcare <br /> Journey?
              </p>
              <p className="font-urbane text-1xl text-black text-center">
                Your health data lives in different clinics, labs, and <br />
                pharmacies, making it impossible to see the full picture.
              </p>
            </div>
          </div>
        </div>
        <Features />
        <StepsSection />
        <PlatformIntro />
        <Testimonials />
        <Footer />
      </div>
      {showAuthModal && <AuthModal onClose={onCloseAuthModal} />}
    </>
  );
};

export default LandingPage;
