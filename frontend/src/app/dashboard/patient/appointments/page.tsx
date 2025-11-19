"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { appointmentRequestAPI, AppointmentRequest, APIError } from "@/services/api";
import CalendarWidget from "@/components/doctor/CalendarWidget";
import PatientAppointmentRequestCard from "@/components/patient/PatientAppointmentRequestCard";

export default function AppointmentsPage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching appointment requests...");
      const data = await appointmentRequestAPI.listForPatient(statusFilter || undefined);
      console.log("Fetched requests:", data);
      console.log("Request statuses:", data.map(r => ({ id: r.request_id, status: r.status })));
      setRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("Failed to load appointment requests");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#ECF4F9] p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">
            View booked visits and upcoming reminders. Need more detail? Open the full calendar.
          </p>
        </div>
        <Link
          href="/dashboard/patient/calendar"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Open Full Calendar
        </Link>
      </div>

      <CalendarWidget />

      <div className="mt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Appointment Requests</h2>
            <p className="text-sm text-gray-600">
              Manage your appointment requests and respond to doctor suggestions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Requests</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="doctor_suggested_alternative">Alternative Suggested</option>
              <option value="patient_accepted_alternative">Alternative Accepted</option>
              <option value="patient_rejected_alternative">Alternative Rejected</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading appointment requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No appointment requests found
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <PatientAppointmentRequestCard
                key={request.request_id}
                request={request}
                onUpdate={fetchRequests}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
