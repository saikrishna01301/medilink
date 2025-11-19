"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { APIError, FileBatchShare, doctorAPI } from "@/services/api";

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

export default function ReportsPage() {
  const { user: _user } = useAuth();
  const [shares, setShares] = useState<FileBatchShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await doctorAPI.listReportShares();
      setShares(data);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load shared reports. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const renderStatusBadge = (share: FileBatchShare) => {
    const status = share.appointment_status || share.appointment_request_status || "Pending";
    const isConfirmed = (share.appointment_status || "").toLowerCase() === "confirmed";
    const badgeClass = isConfirmed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
    const label = share.appointment_id
      ? `Appointment ${share.appointment_id} • ${status}`
      : share.appointment_request_id
      ? `Request ${share.appointment_request_id} • ${status}`
      : status;
    return <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>{label}</span>;
  };

  return (
    <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shared Lab Reports</h1>
              <p className="text-sm text-gray-500">Patients have shared these lab report batches with you.</p>
            </div>
            <button
              onClick={fetchShares}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <svg className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0119 5" />
              </svg>
              Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <svg className="w-6 h-6 animate-spin mr-2 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Loading shared reports...
            </div>
          ) : shares.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
              No patient lab reports have been shared with you yet.
            </div>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <div key={share.share_id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap gap-4 justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="text-lg font-semibold text-gray-900">{share.patient_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Shared on</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(share.shared_at)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {share.batch_heading || "Lab Report Batch"}
                    </span>
                    {renderStatusBadge(share)}
                    <span className="text-xs text-gray-500">
                      {share.appointment_date || share.appointment_request_preferred_date
                        ? `Scheduled: ${formatDateTime(share.appointment_date || share.appointment_request_preferred_date)}`
                        : "Awaiting schedule"}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Files</p>
                    <div className="space-y-2">
                      {share.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                            <p className="text-xs text-gray-500">{file.file_type}</p>
                          </div>
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

