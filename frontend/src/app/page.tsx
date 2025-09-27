import Image from "next/image";
import Header from "@/components/Header"
import LandingPage from '@/components/LandingPage'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <img className = "fixed top-0 z-10 max-w-[1288px]" src = "/Asset1.svg" />
      
      <Header/>
      <LandingPage />
      {
        
      }
    </main>
  );
}