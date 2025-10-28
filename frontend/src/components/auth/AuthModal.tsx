import { useEffect, useState } from "react";
import SignUp from "./SignUp";
import SignIn from "./SignIn";

interface AuthModelProps {
  onClose: () => void;
}

const AuthModel: React.FC<AuthModelProps> = ({ onClose }) => {
  const [selectedRole, setSelectedRole] = useState("Patient");
  const [selectedAuthMode, setSelectedAuthMode] = useState<"SignUp" | "SignIn">(
    "SignUp"
  );

  const roles = [
    { name: "Doctor", img: "/doctor.svg" },
    { name: "Patient", img: "/patient.png" },
    { name: "Insurer", img: "/insurer.svg" },
    { name:  "Pharmasist", img : "/pharmacist.svg"}
  ];

  // FIX 1: Effect to lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-[1000]"
      onClick={onClose}
    >
      <div
        // Changed w-[50%] back to w-[80%] to match original CSS and provide space
        className="bg-white w-[1100px] max-w-[1100px] min-h-[620px] h-[650px] rounded-[10px] p-[30px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-[10] flex justify-between items-center">
          {/* Logo width reduced from 150px to 100px */}
          <img src="/logo.svg" alt="Logo" className="w-[150px] ml-20" />

          <div className="w-[60%] flex justify-around">
            <button
              onClick={() => setSelectedAuthMode("SignUp")}
              className={`
      bg-inherit text-[20px] px-[25px] py-[10px] cursor-pointer 
      ${
        selectedAuthMode === "SignUp"
          ? // Active state: Use the borders
            "text-[#111] border-2 border-[#111] rounded-[25px]"
          : // Inactive state: Apply color and explicitly remove any border
            "text-[#888] border-none"
      }
    `}
            >
              Sign Up
            </button>
            <button
              onClick={() => setSelectedAuthMode("SignIn")}
              className={`
      bg-inherit text-[20px] px-[25px] py-[10px] cursor-pointer 
      ${
        selectedAuthMode === "SignIn"
          ? // Active state: Use the border
            "text-[#111] border-2 border-[#111] rounded-[25px]"
          : // Inactive state: Apply color and explicitly remove any border
            "text-[#888] border-none"
      }
    `}
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="mt-[40px] flex gap-[40px]">
          <div className="w-[40%] flex flex-col gap-[20px]">
            <h3 className="text-center text-[26px] text-[#111] mb-[10px] font-semibold">
              Select Role
            </h3>
            {roles.map((role) => (
              <div
                key={role.name}
                onClick={() => setSelectedRole(role.name)}
                className={`
                  cursor-pointer
                  ${
                    // Gap reduced from 60px to 30px
                    "flex items-center px-[24px] py-[10px] gap-[30px]"
                  }
                  ${
                    selectedRole === role.name
                      ? "border  border-[#111] rounded-[50px]"
                      : ""
                  }
                `}
              >
                {/* Role image size reduced from 60px to 40px */}
                <img
                  src={role.img}
                  alt={role.name}
                  className="w-[40px] h-[40px]"
                />
                <p className="text-[18px] text-[#111]">{role.name}</p>
              </div>
            ))}
          </div>
          {selectedAuthMode === "SignUp" ? <SignUp /> : <SignIn />}
        </div>
      </div>
    </div>
  );
};

export default AuthModel;
