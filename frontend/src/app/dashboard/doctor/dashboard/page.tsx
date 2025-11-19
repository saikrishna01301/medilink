"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { doctorDashboardAPI, DoctorDashboardStats, APIError } from "@/services/api";
import CalendarWidget from "@/components/doctor/CalendarWidget";

export default function DoctorDashboardContent() {
  const { user: _user } = useAuth();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await doctorDashboardAPI.getStats();
        setStats(data);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.detail);
        } else {
          setError("Failed to load dashboard statistics");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      {/* CSS Grid Layout - 3 columns, 3 rows */}
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridTemplateRows: "60px auto auto auto"
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
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : stats?.completed_appointments ?? 0}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : stats?.upcoming_appointments ?? 0}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : stats?.pending_requests ?? 0}
              </p>
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

        {/* Row 2 - Column 1: Active Patients */}
        <div
          className="bg-white rounded-lg shadow p-3"
          style={{ gridRow: "2 / 3", gridColumn: "1 / 2" }}
        >
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Active Patients
          </h3>
          <div className="space-y-1.5">
            <div>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">
                  {isLoading ? "..." : stats?.total_appointments_this_week ?? 0}
                </span>{" "}
                Appointments
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-red-600">
                  {isLoading ? "..." : stats?.cancelled_appointments_this_week ?? 0}
                </span>{" "}
                Cancelled
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">
                  {isLoading ? "..." : stats?.reschedule_requests ?? 0}
                </span>{" "}
                Reschedule requested
              </p>
            </div>
          </div>
        </div>

        {/* Row 2 - Column 2-3: Appointments Calendar */}
        <div
          className="bg-white rounded-lg shadow p-3 flex flex-col"
          style={{ gridRow: "2 / 3", gridColumn: "2 / 4" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Image src="/icons/time.svg" alt="Appointments" width={20} height={20} />
            <h3 className="text-base font-semibold text-gray-900">
              Appointments
            </h3>
          </div>
          <CalendarWidget />
        </div>

        {/* Row 3 - Column 1: Total Patients */}
        <div
          className="bg-white rounded-lg shadow p-3"
          style={{ gridRow: "3 / 4", gridColumn: "1 / 2" }}
        >
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

        {/* Row 3 - Column 2: Active Surgeries */}
        <div
          className="bg-white rounded-lg shadow p-3"
          style={{ gridRow: "3 / 4", gridColumn: "2 / 3" }}
        >
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
                Tomorrow&apos;s Schedule
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

        {/* Row 4 - Column 1-3: Patient List */}
        <div className="bg-white rounded-lg shadow p-4" style={{ gridRow: "4 / 5", gridColumn: "1 / 4" }}>
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
      </div>
    </main>
  );
}

