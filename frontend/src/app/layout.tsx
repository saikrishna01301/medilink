import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google';
import localFont from 'next/font/local'; // 1. Import localFont
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";



const adoha = localFont({
  src: './fonts/Adoha.ttf',
  display: 'swap',
  variable: '--font-adoha', // Optional: for use with Tailwind CSS
});
const urbane = localFont({
  src: './fonts/Urbane-Light.ttf',
  display: 'swap',
  variable: '--font-urbane', // Fixed: was --font-adoha
});

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediHealth | Landing Page",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className = {`${geistSans.variable} ${geistMono.variable} ${adoha.variable} ${urbane.variable} ${inter.variable} antialiased bg-custom-gradient`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
