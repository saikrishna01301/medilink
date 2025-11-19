"use client";

import { useState } from "react";
import { appointmentRequestAPI, AppointmentRequest, APIError } from "@/services/api";

interface AppointmentRequestCardProps {
  request: AppointmentRequest;
  onUpdate: () => void;
}

export default function AppointmentRequestCard({ request, onUpdate }: AppointmentRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestAlternative, setShowSuggestAlternative] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState("");
  const [suggestedStartTime, setSuggestedStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await appointmentRequestAPI.update(request.request_id, {
        status: "accepted",
        notes: notes || undefined,
      });
      onUpdate();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("Failed to accept appointment request");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this appointment request?")) {
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      await appointmentRequestAPI.update(request.request_id, {
        status: "rejected",
        notes: notes || undefined,
      });
      onUpdate();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("Failed to reject appointment request");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestAlternative = async () => {
    if (!suggestedDate || !suggestedStartTime) {
      setError("Please fill in all fields for alternative time");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const suggestedDateTime = new Date(`${suggestedDate}T${suggestedStartTime}`);
      await appointmentRequestAPI.update(request.request_id, {
        status: "doctor_suggested_alternative",
        suggested_date: suggestedDateTime.toISOString(),
        suggested_time_slot_start: suggestedStartTime,
        notes: notes || undefined,
      });
      onUpdate();
      setShowSuggestAlternative(false);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("Failed to suggest alternative time");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const preferredDateTime = new Date(request.preferred_date);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {request.status === "pending" ? "Pending" : request.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Appointment Request
          </h3>
          <p className="text-sm text-gray-600">
            Preferred Date: <span className="font-medium">{formatDate(request.preferred_date)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Preferred Time: <span className="font-medium">
              {formatTime(request.preferred_time_slot_start)}
            </span>
          </p>
          {request.is_flexible && (
            <p className="text-xs text-blue-600 mt-1">✓ Patient is flexible with time</p>
          )}
          {request.reason && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700">Reason:</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
          )}
        </div>
      </div>

      {request.status === "pending" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about this appointment..."
            />
          </div>

          {!showSuggestAlternative ? (
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? "Processing..." : "Accept"}
              </button>
              {request.is_flexible && (
                <button
                  onClick={() => setShowSuggestAlternative(true)}
                  disabled={isProcessing}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Suggest Alternative
                </button>
              )}
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? "Processing..." : "Reject"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h4 className="text-sm font-semibold text-gray-900">Suggest Alternative Time</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    min={today}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={suggestedStartTime}
                    onChange={(e) => setSuggestedStartTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSuggestAlternative}
                  disabled={isProcessing}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? "Sending..." : "Send Suggestion"}
                </button>
                <button
                  onClick={() => {
                    setShowSuggestAlternative(false);
                    setSuggestedDate("");
                    setSuggestedStartTime("");
                    setError(null);
                  }}
                  disabled={isProcessing}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {request.status === "doctor_suggested_alternative" && request.suggested_date && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-600">
            You suggested: <span className="font-medium">
              {formatDate(request.suggested_date)} at {formatTime(request.suggested_time_slot_start || "")}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Waiting for patient response...</p>
        </div>
      )}

      {request.status === "accepted" && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-green-600 font-medium">✓ Appointment Accepted</p>
          {request.appointment_id && (
            <p className="text-xs text-gray-500 mt-1">Appointment ID: {request.appointment_id}</p>
          )}
        </div>
      )}

      {request.status === "rejected" && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-red-600 font-medium">✗ Appointment Rejected</p>
        </div>
      )}
    </div>
  );
}

