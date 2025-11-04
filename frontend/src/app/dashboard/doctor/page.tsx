"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function DoctorDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    } else if (!isLoading && user?.role !== "doctor") {
      router.push(`/dashboard/${user?.role}`);
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "doctor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const doctorName = `Dr. ${user.first_name} ${user.last_name}`;

  // Generate calendar days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(
      new Date(year, month + (direction === "next" ? 1 : -1), 1)
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#ECF4F9" }}>
      <div className="w-full max-w-[1280px] flex flex-col">
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
                  className="rounded-full border border-gray-300 px-4 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  style={{ width: "400px" }}
                />
                <svg
                  className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
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
              <button className="text-gray-600 hover:text-gray-800">
                <Image
                  src="/icons/bell.svg"
                  alt="Notifications"
                  width={20}
                  height={20}
                />
              </button>

              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doctorName}
                  </p>
                  <p className="text-xs text-gray-500">
                    General Practitioner G.P.
                  </p>
                  <p className="text-xs text-gray-500">since 2004</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome Message Div - Full width, centered text, no background, no shadows */}
        <div className="w-full text-center py-2">
          <p className="text-gray-700">Welcome back {doctorName}</p>
        </div>

        <div className="flex flex-1">
          {/* Sidebar - 256px */}
          <aside className="flex flex-col" style={{ width: "256px", backgroundColor: "#ECF4F9", height: "calc(100vh - 73px)" }}>
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
              {/* Overview Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Overview
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg text-gray-800 font-medium shadow-sm"
                    >
                      <Image
                        src="/icons/dashboard.svg"
                        alt="Dashboard"
                        width={20}
                        height={20}
                      />
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/calendar-clock.svg"
                        alt="Appointments"
                        width={20}
                        height={20}
                      />
                      Appointments
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/users.svg"
                        alt="Patients"
                        width={20}
                        height={20}
                      />
                      Patients
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/messages.svg"
                        alt="Chats"
                        width={20}
                        height={20}
                      />
                      Chats
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/data-report.svg"
                        alt="Reports"
                        width={20}
                        height={20}
                      />
                      Reports
                    </a>
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
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/dashboard.svg"
                        alt="Dashboard"
                        width={20}
                        height={20}
                      />
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/file-invoice-dollar.svg"
                        alt="Payment History"
                        width={20}
                        height={20}
                      />
                      Payment History
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/data-report.svg"
                        alt="Reports"
                        width={20}
                        height={20}
                      />
                      Reports
                    </a>
                  </li>
                </ul>
              </div>

              {/* Account Settings Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-1">
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                  >
                    <Image
                      src="/icons/account-settings.svg"
                      alt="Account Settings"
                      width={20}
                      height={20}
                    />
                    Account Settings
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                  >
                    <Image
                      src="/icons/headphones.svg"
                      alt="Help & Support"
                      width={20}
                      height={20}
                    />
                    Help & Support
                  </a>
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

          {/* Main Content - 1024px */}
          <div className="flex flex-col" style={{ width: "1024px" }}>
            {/* Main Content Area */}
            <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
              {/* CSS Grid Layout - 3 columns, 3 rows */}
              <div 
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gridTemplateRows: "60px auto auto"
                }}
              >
                {/* Row 1 - Summary Cards */}
                {/* Completed Appointments - Column 1 */}
                <div className="bg-white rounded-lg shadow p-3" style={{ height: "60px" }}>
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">
                        Completed Appointments
                      </p>
                      <p className="text-2xl font-bold text-gray-900">128</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <span>25%</span>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Appointments - Column 2 */}
                <div className="bg-white rounded-lg shadow p-3" style={{ height: "60px" }}>
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">
                        Upcoming Appointments
                      </p>
                      <p className="text-2xl font-bold text-gray-900">44</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Requests - Column 3 */}
                <div className="bg-white rounded-lg shadow p-3" style={{ height: "60px" }}>
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">
                        Patient Requests
                      </p>
                      <p className="text-2xl font-bold text-gray-900">109</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <span>14%</span>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2 - Column 1: Total Patients */}
                <div className="bg-white rounded-lg shadow p-3" style={{ gridRow: "2 / 3", gridColumn: "1 / 2" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Image
                      src="/icons/friends.svg"
                      alt="Total Patients"
                      width={20}
                      height={20}
                    />
                    <h3 className="text-base font-semibold text-gray-900">
                      Total Patients
                    </h3>
                  </div>
                  <div className="space-y-1 mb-2">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">134</span> Seen
                      this week
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">52</span>{" "}
                      Pending this week
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">3</span>{" "}
                      appointment cancelled
                    </p>
                  </div>
                  <div className="flex gap-0.5 text-xs">
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                      (day, idx) => (
                        <div
                          key={day}
                          className={`flex-1 text-center py-1 rounded ${
                            idx >= 3 && idx <= 5
                              ? "bg-blue-100 text-blue-800 font-semibold"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          <div className="text-xs">{day}</div>
                          <div className="mt-0.5 text-xs">{6 + idx}</div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Row 2 - Column 2: Active Patients and Active Surgeries Container */}
                <div className="flex flex-col gap-4" style={{ gridRow: "2 / 3", gridColumn: "2 / 3" }}>
                  {/* Active Patients */}
                  <div className="bg-white rounded-lg shadow p-3 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      Active Patients
                    </h3>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-900">172</span>{" "}
                          Appointments
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold text-red-600">3</span>{" "}
                          Cancelled
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-900">9</span>{" "}
                          Reschedule requested
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Surgeries */}
                  <div className="bg-white rounded-lg shadow p-3 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      Active Surgeries
                    </h3>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-900">1</span>{" "}
                          Surgery done
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-900">18</span>{" "}
                          Surgery pending
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2 - Column 3: Appointments Calendar */}
                <div className="bg-white rounded-lg shadow p-3 flex flex-col overflow-hidden" style={{ gridRow: "2 / 3", gridColumn: "3 / 4", height: "100%" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Image
                      src="/icons/time.svg"
                      alt="Appointments"
                      width={20}
                      height={20}
                    />
                    <h3 className="text-base font-semibold text-gray-900">
                      Appointments
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigateMonth("prev")}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <span className="text-xs font-medium text-gray-900">
                        {monthNames[month]} {year}
                      </span>
                      <button
                        onClick={() => navigateMonth("next")}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-gray-600">Surgery</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span className="text-gray-600">Home-visit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                      <span className="text-gray-600">Evaluation</span>
                    </div>
                  </div>

                  <div className="flex-1 mb-2 overflow-hidden">
                    <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                      {weekDays.map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-gray-600 py-0.5"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarDays.map((day, idx) => {
                        const hasAppointment = day && [8, 9, 15, 22, 23, 24, 29].includes(day);
                        return (
                          <div
                            key={idx}
                            className={`aspect-square flex items-center justify-center text-xs ${
                              day
                                ? "text-gray-900 hover:bg-gray-50 cursor-pointer"
                                : "text-gray-300"
                            }`}
                            style={{ minHeight: 0 }}
                          >
                            {day && (
                              <div className="relative">
                                {day}
                                {hasAppointment && (
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-0.5 mt-auto">
                    <p>06 home-visits</p>
                    <p>142 Evaluations (in clinic)</p>
                    <p>18 Surgery</p>
                  </div>
                </div>

                {/* Row 3 - Column 1-2: Patient List */}
                <div className="bg-white rounded-lg shadow p-4" style={{ gridRow: "3 / 4", gridColumn: "1 / 3" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Patient
                      </h3>
                      <p className="text-xs text-gray-500">
                        This is your several latest patient list
                      </p>
                    </div>
                    <a href="#" className="text-blue-600 text-xs font-medium">
                      See All
                    </a>
                  </div>
                  <div className="mb-3">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option>Sort: A-Z</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1.5 text-gray-600 font-medium">
                            Name
                          </th>
                          <th className="text-left py-1.5 text-gray-600 font-medium">
                            Ward No.
                          </th>
                          <th className="text-left py-1.5 text-gray-600 font-medium">
                            Priority
                          </th>
                          <th className="text-left py-1.5 text-gray-600 font-medium">
                            Start Date
                          </th>
                          <th className="text-left py-1.5 text-gray-600 font-medium">
                            End Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            name: "Adam Messy",
                            gender: "Male",
                            age: 26,
                            ward: "#123456",
                            priority: "Medium",
                            priorityColor: "blue",
                            startDate: "June 3, 2023",
                            endDate: "--",
                          },
                          {
                            name: "Celine Aluista",
                            gender: "Female",
                            age: 22,
                            ward: "#985746",
                            priority: "Low",
                            priorityColor: "green",
                            startDate: "May 31, 2023",
                            endDate: "June 4, 2023",
                          },
                          {
                            name: "Malachi Ardo",
                            gender: "Male",
                            age: 19,
                            ward: "#047638",
                            priority: "High",
                            priorityColor: "red",
                            startDate: "June 7, 2023",
                            endDate: "--",
                          },
                          {
                            name: "Mathias Olivera",
                            gender: "Male",
                            age: 24,
                            ward: "#248957",
                            priority: "Medium",
                            priorityColor: "blue",
                            startDate: "June 1, 2023",
                            endDate: "June 5, 2023",
                          },
                        ].map((patient, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                                <div>
                                  <p className="font-medium text-gray-900 text-xs">
                                    {patient.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {patient.gender}, {patient.age} Years
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 text-gray-600 text-xs">
                              {patient.ward}
                            </td>
                            <td className="py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  patient.priorityColor === "red"
                                    ? "bg-red-100 text-red-800"
                                    : patient.priorityColor === "green"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {patient.priority}
                              </span>
                            </td>
                            <td className="py-2 text-gray-600 text-xs">
                              {patient.startDate}
                            </td>
                            <td className="py-2 text-gray-600 text-xs">
                              {patient.endDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Row 3 - Column 3: Schedule */}
                <div className="bg-white rounded-lg shadow p-4 flex flex-col" style={{ gridRow: "3 / 4", gridColumn: "3 / 4" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Image
                      src="/icons/time-management.svg"
                      alt="Schedule"
                      width={20}
                      height={20}
                    />
                    <h3 className="text-base font-semibold text-gray-900">
                      Schedule
                    </h3>
                  </div>

                  {/* Today Schedule */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-semibold text-gray-900">
                        Today Schedule
                      </h4>
                      <a href="#" className="text-blue-600 text-xs">
                        view all
                      </a>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { name: "Nicole Jacob", time: "09:00 AM - 09:30 AM" },
                        { name: "Josep Suherman", time: "10:00 AM - 10:30 AM" },
                        { name: "Samuel Christ", time: "11:00 AM - 11:30 AM" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Today 10 Sept 2020 - {item.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tomorrow Schedule */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-semibold text-gray-900">
                        Tomorrow's Schedule
                      </h4>
                      <a href="#" className="text-blue-600 text-xs">
                        view all
                      </a>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { name: "Bosa S.", time: "09:00 AM - 09:30 AM" },
                        { name: "Sheryl Fatonah", time: "10:00 AM - 10:30 AM" },
                        { name: "Indie Sukaja", time: "11:00 AM - 11:30 AM" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Tomorrow 11 Sept 2020 - {item.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
