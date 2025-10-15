"use client";

// components/Header.tsx
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  onOpenAuthModal: () => void;
}

const Header = ({ onOpenAuthModal }: HeaderProps) => {
  return (
    <>
      <header className=" w-[80%] pb-5 pt-5 flex items-center justify-between border-b mx-auto">
        {/* Logo */}

        <Link href="/">
          <Image
            src="/logo.svg"
            alt="MediHealth"
            width={190}
            height={50}
            priority
          />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/about" className="text-gray-600 hover:text-black">
            About
          </Link>
          <Link href="/testimony" className="text-gray-600 hover:text-black">
            Testimony
          </Link>
          <Link href="/blogs" className="text-gray-600 hover:text-black">
            Blogs
          </Link>
        </nav>

        {/* Sign In/Sign Up Button */}
        <button
          onClick={() => onOpenAuthModal()}
          className="bg-white text-black px-6 py-2 rounded-full shadow-md font-semibold hover:bg-gray-100 transition-colors"
        >
          Sign up / sign in
        </button>
      </header>
    </>
  );
};

export default Header;
