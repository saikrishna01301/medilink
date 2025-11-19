"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import NotificationBell from "@/components/common/NotificationBell";
import Link from "next/link";

interface PatientLayoutProps {
  children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    } else if (!isLoading && user?.role !== "patient") {
      router.push(`/dashboard/${user?.role}`);
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "patient") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const patientName = `${user.first_name} ${user.last_name}`;

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ECF4F9" }}>
      {/* Sidebar - 256px, positioned outside and to the left of 1280px boundary */}
      <aside className="flex flex-col flex-shrink-0" style={{ width: "256px", backgroundColor: "#ECF4F9", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 10 }}>
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
              {/* Overview Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Overview
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/dashboard/patient/dashboard"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/dashboard")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/dashboard.svg"
                        alt="Dashboard"
                        width={20}
                        height={20}
                      />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/appointments"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/appointments")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/calendar-clock.svg"
                        alt="Appointments"
                        width={20}
                        height={20}
                      />
                      Appointments
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/doctors"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/doctors")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/users.svg"
                        alt="Doctors"
                        width={20}
                        height={20}
                      />
                      Doctors
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/lab-reports"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/lab-reports")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/microscope.svg"
                        alt="Lab Test Reports"
                        width={20}
                        height={20}
                      />
                      Lab Test Reports
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/prescriptions"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/prescriptions")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/medical-prescription.svg"
                        alt="My Prescription"
                        width={20}
                        height={20}
                      />
                      My Prescription
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/chats"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/chats")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/messages.svg"
                        alt="Chats"
                        width={20}
                        height={20}
                      />
                      Chats
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/insurance"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/insurance")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/file-invoice-dollar.svg"
                        alt="Insurance"
                        width={20}
                        height={20}
                      />
                      Insurance
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Finance Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Finance
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/dashboard/patient/finance"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/finance")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/dashboard.svg"
                        alt="Dashboard"
                        width={20}
                        height={20}
                      />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/payment-history"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/payment-history")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/file-invoice-dollar.svg"
                        alt="Payment History"
                        width={20}
                        height={20}
                      />
                      Payment History
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/patient/reports"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive("/dashboard/patient/reports")
                          ? "bg-white text-gray-800 font-medium shadow-sm"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Image
                        src="/icons/data-report.svg"
                        alt="Reports"
                        width={20}
                        height={20}
                      />
                      Reports
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Account Settings Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-1">
                  <Link
                    href="/dashboard/patient/settings"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive("/dashboard/patient/settings")
                        ? "bg-white text-gray-800 font-medium shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    <Image
                      src="/icons/account-settings.svg"
                      alt="Account Settings"
                      width={20}
                      height={20}
                    />
                    Account Settings
                  </Link>
                  <Link
                    href="/dashboard/patient/support"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive("/dashboard/patient/support")
                        ? "bg-white text-gray-800 font-medium shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    <Image
                      src="/icons/headphones.svg"
                      alt="Help & Support"
                      width={20}
                      height={20}
                    />
                    Help & Support
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                  >
                    <Image
                      src="/icons/log-out.svg"
                      alt="Logout"
                      width={20}
                      height={20}
                    />
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          </aside>

      {/* Main container - 1280px boundary, centered and offset by sidebar */}
      <div className="flex flex-col mx-auto" style={{ maxWidth: "1280px", marginLeft: "calc(256px + (100% - 256px - 1280px) / 2)", width: "1280px" }}>
        {/* Header - No white background, no shadow */}
        <header className="px-6 py-3 w-full">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="MEDIHEALTH"
                width={190}
                height={50}
              />
            </div>

            {/* Right Side - Search, Icons and Profile */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Search Bar - Wider with fully rounded ends */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="rounded-full border border-gray-300 px-4 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder:text-gray-400"
                  style={{ width: "400px" }}
                />
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button className="text-gray-600 hover:text-gray-800">
                <Image
                  src="/icons/messages.svg"
                  alt="Chat"
                  width={20}
                  height={20}
                />
              </button>
              <NotificationBell />

              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/Avatar.jpg"
                    alt="User"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {patientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Patient
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome Message Div - Full width, centered text, no background, no shadows */}
        <div className="w-full text-center py-2">
          <p className="text-gray-700">Welcome back {patientName}</p>
        </div>

        {/* Main Content - 1280px */}
        <div className="flex flex-col flex-1" style={{ width: "1280px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

