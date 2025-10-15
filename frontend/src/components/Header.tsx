"use client";
import { useState } from "react";
import Image from 'next/image';
import Link from 'next/link';



export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <header className="navbar" >

      <Link href="/" className='logo'>
        <Image
          src="/logo.svg"
          alt="MediHealth"
          width={190}
          height={50}
          priority
        />
      </Link>

      <nav className="nav-links">
        <Link href="/about" className="text-gray-600 hover:text-black">About</Link>
        <Link href="/testimony" className="text-gray-600 hover:text-black">Testimony</Link>
        <Link href="/blogs" className="text-gray-600 hover:text-black">Blogs</Link>
      </nav>


      <Link href="/auth/login" className="login-signup-button">Sign up / sign in</Link>
      <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="md:hidden p-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="/menu.svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={`
        ${isMenuOpen ? 'flex' : 'hidden'} 
        flex-col gap-4 absolute top-full left-0 w-full bg-white p-4 shadow-md border-t
        md:hidden 
      `}>
        <Link href="/about" className="text-gray-600 hover:text-black">About</Link>
        <Link href="/testimony" className="text-gray-600 hover:text-black">Testimony</Link>
        <Link href="/blogs" className="text-gray-600 hover:text-black">Blogs</Link>
      </div>
    </header>
  );
};