"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { appointmentRequestAPI, AppointmentRequest, APIError } from "@/services/api";
import CalendarWidget from "@/components/doctor/CalendarWidget";
import AppointmentRequestCard from "@/components/doctor/AppointmentRequestCard";

export default function AppointmentsPage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentRequestAPI.listForDoctor(statusFilter || undefined);
      setRequests(data);
    } catch (err) {
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

      <div className="mt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Appointment Requests</h2>
            <p className="text-sm text-gray-600">
              Review and manage appointment requests from patients
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
              <option value="doctor_suggested_alternative">Suggested Alternative</option>
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
              <AppointmentRequestCard
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
