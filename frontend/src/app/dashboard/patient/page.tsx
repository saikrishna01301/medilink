"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

type ActivityType = "appointment" | "share" | "order" | "therapy" | "chore" | "collect";

interface Activity {
  date: string;
  time: string;
  type: ActivityType;
  title: string;
  provider: string;
  location: string;
  description: string;
  dateLabel?: string;
}

export default function PatientDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    } else if (!isLoading && user?.role !== "patient") {
      // Redirect to appropriate dashboard if wrong role
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

  const activities: Activity[] = [
    {
      date: "Oct 16th 2025",
      time: "16:25pm",
      type: "appointment",
      title: "Appointment",
      provider: "Dr. Orange Cat | GP",
      location: "Lifeline Clinic",
      description: "Have an Appointment with Dr. Orange Cat specializing in General Praticing & Cardiology follow-up appointment for Recurring Headaches. Patient states ' having headaches since last few months on irregular itervals and having problem in his sleeps '.",
      dateLabel: "Tomorrow"
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "share",
      title: "Share Record",
      provider: "Dr. Orange Cat | GP",
      location: "Online",
      description: "Share weekly blood sugar ( glucose level ) and Blood Pressure Level with Dr. Orange Cat",
      dateLabel: "Today"
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "order",
      title: "Order Meds",
      provider: "CSV Pharmacy",
      location: "Online",
      description: "Metaformin 500mg is running low and is prescribed to be taken until next week order early to prevent skipping dosage"
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "therapy",
      title: "Physiotherapy",
      provider: "Dr. Orange Cat | GP",
      location: "Lifeline Clinic",
      description: "Metaformin 500mg is running low and is prescribed to be taken until next week order early to prevent skipping dosage",
      dateLabel: "Yesterday"
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "chore",
      title: "Some Chore",
      provider: "Dr. Orange Cat | GP",
      location: "Clinic Pickup",
      description: "Blood test report for thyroid check is complete and ready to be collected."
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "collect",
      title: "Collect report",
      provider: "Dr. Orange Cat | GP",
      location: "Clinic Pickup",
      description: "Blood test report for thyroid check is complete and ready to be collected."
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "collect",
      title: "Collect report",
      provider: "Dr. Orange Cat | GP",
      location: "Clinic Pickup",
      description: "Blood test report for thyroid check is complete and ready to be collected."
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "collect",
      title: "Collect report",
      provider: "Dr. Orange Cat | GP",
      location: "Clinic Pickup",
      description: "Blood test report for thyroid check is complete and ready to be collected."
    },
    {
      date: "Oct 15th 2025",
      time: "02:00pm",
      type: "collect",
      title: "Collect report",
      provider: "Dr. Orange Cat | GP",
      location: "Clinic Pickup",
      description: "Blood test report for thyroid check is complete and ready to be collected."
    }
  ];

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "appointment":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "share":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        );
      case "order":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case "therapy":
      case "chore":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "collect":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const patientName = `${user.first_name} ${user.last_name}`;

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
                        alt="Doctors"
                        width={20}
                        height={20}
                      />
                      Doctors
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/microscope.svg"
                        alt="Lab Test Reports"
                        width={20}
                        height={20}
                      />
                      Lab Test Reports
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      <Image
                        src="/icons/medical-prescription.svg"
                        alt="My Prescription"
                        width={20}
                        height={20}
                      />
                      My Prescription
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
                        src="/icons/file-invoice-dollar.svg"
                        alt="Insurance"
                        width={20}
                        height={20}
                      />
                      Insurance
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
              {/* CSS Grid Layout - 3 columns */}
              <div 
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gridAutoRows: "minmax(auto, auto)"
                }}
              >
                {/* Row 1 - Tracker Cards */}
                {/* Upcoming Appointments Card - Column 1 */}
                <div className="bg-white rounded-lg shadow p-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        Upcoming Appointments
                        <button className="text-blue-500 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Doctor</span>
                        <span className="text-gray-500">Appointment</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-gray-900">Dr. Orange Cat | GP</span>
                        <span className="font-medium text-gray-900">Thursday Oct 16 2025</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Physician</span>
                        <span className="text-gray-500">16:25 EST</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blood Sugar Tracker Card - Column 2 */}
                <div className="bg-white rounded-lg shadow p-3">
                  <div className="border-l-4 border-red-500 pl-3">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        Blood Sugar Tracker
                        <button className="text-red-500 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Glucose lvl</div>
                        <div className="font-bold text-red-600 text-base">143 mg/dl</div>
                        <div className="text-gray-400 text-xs">-- mg/dl</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">time/date</div>
                        <div className="font-medium text-gray-900">07:43am today</div>
                        <div className="text-gray-400 text-xs">-- today</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Context</div>
                        <div className="font-medium text-gray-900">Before Breakfast</div>
                        <div className="text-gray-400 text-xs">After Breakfast</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blood Pressure Tracker Card - Column 3 */}
                <div className="bg-white rounded-lg shadow p-3">
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        Blood Pressure Tracker
                        <button className="text-green-500 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </h3>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Systolic</div>
                        <div className="font-bold text-green-600 text-base">125 mmHg</div>
                        <div className="text-gray-400 text-xs">-- mmHg</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Diastolic</div>
                        <div className="font-bold text-green-600 text-base">82 mmHg</div>
                        <div className="text-gray-400 text-xs">-- mmHg</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Pulse</div>
                        <div className="font-bold text-green-600 text-base">68 BPM</div>
                        <div className="text-gray-400 text-xs">-- BPM</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">time/date</div>
                        <div className="font-medium text-gray-900 text-xs">07:43 am Today</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2 - Timeline - Spans all 3 columns */}
                <div className="bg-white rounded-lg shadow p-4" style={{ gridColumn: "1 / 4" }}>
                  {activities.map((activity, index) => (
                    <div key={index} className="relative">
                      {/* Date Label */}
                      {activity.dateLabel && (
                        <div className="flex justify-center mb-6">
                          <span className="bg-green-100 text-green-800 px-6 py-1.5 rounded-full text-sm font-medium">
                            {activity.dateLabel}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-6 pb-8">
                        {/* Date/Time */}
                        <div className="w-32 text-right flex-shrink-0">
                          <div className="text-pink-500 font-medium text-sm">{activity.date}</div>
                          <div className="text-pink-500 font-medium text-sm">{activity.time}</div>
                        </div>

                        {/* Timeline Dot and Line */}
                        <div className="relative flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-pink-500 ring-4 ring-pink-100 z-10"></div>
                          {index < activities.length - 1 && (
                            <div className="w-0.5 h-full bg-pink-200 absolute top-3"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-2">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <span className="font-semibold text-blue-600">{activity.title}</span>
                                <span className="font-medium text-gray-900">{activity.provider}</span>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-sm font-medium">{activity.location}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

