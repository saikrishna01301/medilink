"use client";

import { useState } from "react";
import { appointmentRequestAPI, AppointmentRequest, APIError } from "@/services/api";

interface PatientAppointmentRequestCardProps {
  request: AppointmentRequest;
  onUpdate: () => void;
}

export default function PatientAppointmentRequestCard({ request, onUpdate }: PatientAppointmentRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleAcceptAlternative = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log("=== ACCEPT ALTERNATIVE ===");
      console.log("Request ID:", request.request_id);
      console.log("Current status:", request.status);
      
      const updated = await appointmentRequestAPI.update(request.request_id, {
        status: "patient_accepted_alternative",
      });
      
      console.log("API Response - Updated request:", updated);
      console.log("New status from API:", updated.status);
      
      setIsProcessing(false);
      
      // Refresh immediately - the backend should have updated by now
      console.log("Refreshing request list...");
      onUpdate();
    } catch (err) {
      console.error("Error accepting alternative:", err);
      setIsProcessing(false);
      if (err instanceof APIError) {
        setError(err.detail || "Failed to accept alternative time");
      } else if (err instanceof Error) {
        setError(err.message || "Failed to accept alternative time");
      } else {
        setError("Failed to accept alternative time. Please try again.");
      }
    }
  };

  const handleRejectAlternative = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to reject the doctor's suggested alternative time?")) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log("=== REJECT ALTERNATIVE ===");
      console.log("Request ID:", request.request_id);
      console.log("Current status:", request.status);
      
      const updated = await appointmentRequestAPI.update(request.request_id, {
        status: "patient_rejected_alternative",
      });
      
      console.log("API Response - Updated request:", updated);
      console.log("New status from API:", updated.status);
      
      setIsProcessing(false);
      
      // Refresh immediately - the backend should have updated by now
      console.log("Refreshing request list...");
      onUpdate();
    } catch (err) {
      console.error("Error rejecting alternative:", err);
      setIsProcessing(false);
      if (err instanceof APIError) {
        setError(err.detail || "Failed to reject alternative time");
      } else if (err instanceof Error) {
        setError(err.message || "Failed to reject alternative time");
      } else {
        setError("Failed to reject alternative time. Please try again.");
      }
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const appointmentType = request.status === "confirmed" ? "appointment" : "appointment request";
    if (!confirm(`Are you sure you want to cancel this ${appointmentType}?`)) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log("=== CANCEL APPOINTMENT ===");
      console.log("Request ID:", request.request_id);
      console.log("Current status:", request.status);
      
      const updated = await appointmentRequestAPI.update(request.request_id, {
        status: "cancelled",
      });
      
      console.log("API Response - Updated request:", updated);
      console.log("New status from API:", updated.status);
      
      setIsProcessing(false);
      
      // Refresh immediately
      console.log("Refreshing request list...");
      onUpdate();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      setIsProcessing(false);
      if (err instanceof APIError) {
        setError(err.detail || "Failed to cancel appointment");
      } else if (err instanceof Error) {
        setError(err.message || "Failed to cancel appointment");
      } else {
        setError("Failed to cancel appointment. Please try again.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
      doctor_suggested_alternative: { label: "Alternative Suggested", className: "bg-blue-100 text-blue-700" },
      confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-2 py-1 ${statusInfo.className} text-xs font-medium rounded`}>
        {statusInfo.label}
      </span>
    );
  };

  const isAlternativeSuggested = request.status === "doctor_suggested_alternative" && 
                                  request.suggested_date && 
                                  request.suggested_time_slot_start;

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
            {getStatusBadge(request.status)}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Appointment Request
          </h3>
          <p className="text-sm text-gray-600">
            Requested Date: <span className="font-medium">{formatDate(request.preferred_date)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Requested Time: <span className="font-medium">
              {formatTime(request.preferred_time_slot_start)}
            </span>
          </p>
          {request.reason && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700">Reason:</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
          )}
          {request.notes && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700">Notes:</p>
              <p className="text-sm text-gray-600">{request.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Show alternative suggestion and action buttons */}
      {isAlternativeSuggested && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 mb-1">Doctor Suggested Alternative Time:</p>
            <p className="text-sm text-blue-700">
              <span className="font-medium">
                {formatDate(request.suggested_date)} at {formatTime(request.suggested_time_slot_start)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAcceptAlternative}
              disabled={isProcessing}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? "Processing..." : "Accept Alternative"}
            </button>
            <button
              type="button"
              onClick={handleRejectAlternative}
              disabled={isProcessing}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? "Processing..." : "Reject Alternative"}
            </button>
          </div>
        </div>
      )}

      {/* Status messages */}
      {request.status === "accepted" && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-green-600 font-medium">✓ Appointment Accepted by Doctor</p>
          {request.appointment_id && (
            <p className="text-xs text-gray-500 mt-1">Appointment ID: {request.appointment_id}</p>
          )}
        </div>
      )}

      {request.status === "rejected" && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-red-600 font-medium">✗ Appointment Rejected by Doctor</p>
        </div>
      )}

      {request.status === "confirmed" && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-green-600 font-medium">✓ Appointment Confirmed</p>
          {request.suggested_date && request.suggested_time_slot_start && (
            <p className="text-xs text-gray-600 mt-1">
              Confirmed for {formatDate(request.suggested_date)} at {formatTime(request.suggested_time_slot_start)}
            </p>
          )}
          {request.appointment_id && (
            <p className="text-xs text-gray-500 mt-1">Appointment ID: {request.appointment_id}</p>
          )}
        </div>
      )}

      {request.status === "cancelled" && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-600 font-medium">✗ Appointment Cancelled</p>
          <p className="text-xs text-gray-500 mt-1">The appointment request has been cancelled.</p>
          {request.notes && request.notes.includes("Cancelled by patient") && (
            <p className="text-xs text-gray-500 mt-1">Cancelled by patient</p>
          )}
        </div>
      )}

      {/* Cancel button - show for pending and confirmed appointments */}
      {(request.status === "pending" || request.status === "confirmed" || request.status === "accepted" || request.status === "doctor_suggested_alternative") && (
        <div className="border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full rounded-lg border-2 border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? "Cancelling..." : "Cancel Appointment"}
          </button>
        </div>
      )}
    </div>
  );
}
