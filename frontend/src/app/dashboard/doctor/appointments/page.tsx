"use client";

import Link from "next/link";

import CalendarWidget from "@/components/doctor/CalendarWidget";

export default function AppointmentsPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-[#ECF4F9] p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">
            Review your upcoming schedule at a glance or open the full calendar to plan ahead.
          </p>
        </div>
        <Link
          href="/dashboard/doctor/calendar"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Open Full Calendar
        </Link>
      </div>

      <CalendarWidget />
    </main>
  );
}
