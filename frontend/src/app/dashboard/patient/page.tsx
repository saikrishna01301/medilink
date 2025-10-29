"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
  const [activeSection, setActiveSection] = useState("dashboard");

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

  return (
    <div className="flex h-screen bg-gray-50 justify-center">
      <div className="flex w-full max-w-[1280px]">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <img src="/logo.svg" alt="MEDILINK" className="h-8" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          {/* Overview Section */}
          <div className="mb-8">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Overview
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveSection("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeSection === "dashboard"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                Dashboard
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Appointments
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Doctors
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chats
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Insurance
              </button>
            </div>
          </div>

          {/* Finance Section */}
          <div className="mb-8">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Finance
            </h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                Dashboard
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Payment History
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reports
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 space-y-1 border-t">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Help & Support
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-end gap-4">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              <img src="/Avatar.jpg" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Tracker Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Upcoming Appointments Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Upcoming Appointments
                    <button className="text-blue-500 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Doctor</span>
                    <span className="text-gray-500">Appointment</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">Dr. Orange Cat | GP</span>
                    <span className="font-medium text-gray-900">Thursday Oct 16 2025</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Physician</span>
                    <span className="text-gray-500">16:25 EST</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Blood Sugar Tracker Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-l-4 border-red-500">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Blood Sugar Tracker
                    <button className="text-red-500 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Glucose lvl</div>
                    <div className="font-bold text-red-600 text-lg">143 mg/dl</div>
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

            {/* Blood Pressure Tracker Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-l-4 border-green-500">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Blood Pressure Tracker
                    <button className="text-green-500 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </h3>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Systolic</div>
                    <div className="font-bold text-green-600 text-lg">125 mmHg</div>
                    <div className="text-gray-400 text-xs">-- mmHg</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Diastolic</div>
                    <div className="font-bold text-green-600 text-lg">82 mmHg</div>
                    <div className="text-gray-400 text-xs">-- mmHg</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Pulse</div>
                    <div className="font-bold text-green-600 text-lg">68 BPM</div>
                    <div className="text-gray-400 text-xs">-- BPM</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">time/date</div>
                    <div className="font-medium text-gray-900 text-xs">07:43 am Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
  );
}

