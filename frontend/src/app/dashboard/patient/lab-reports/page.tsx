"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { patientFileAPI, FileBatch } from "@/services/api";
import FileUploadSection from "@/components/patient/FileUploadSection";
import FileTimelineSection from "@/components/patient/FileTimelineSection";
import ShareReportsModal from "@/components/patient/ShareReportsModal";

export default function LabReportsPage() {
  const { user: _user } = useAuth();
  const [batches, setBatches] = useState<FileBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<FileBatch | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await patientFileAPI.listBatches("lab_report");
      setBatches(data);
    } catch (err: unknown) {
      const errorObj = err as { detail?: string };
      setError(errorObj.detail || "Failed to load lab reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleUploadSuccess = (batch: FileBatch) => {
    // Add the new batch to the beginning of the list (most recent first)
    setBatches((prev) => [batch, ...prev]);
  };

  const handleBatchDeleted = () => {
    // Refresh the batches list
    fetchBatches();
  };

  const handleOpenShareModal = (batch: FileBatch) => {
    setSelectedBatch(batch);
    setShareMessage(null);
    setShareModalOpen(true);
  };

  const handleShareSuccess = (message?: string) => {
    if (message) {
      setShareMessage(message);
    }
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedBatch(null);
  };

  return (
    <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Lab Test Reports</h1>

        {/* Upload Section */}
        <FileUploadSection category="lab_report" onUploadSuccess={handleUploadSuccess} />

        {shareMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {shareMessage}
          </div>
        )}

        {/* Timeline Section */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchBatches}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <FileTimelineSection
            batches={batches}
            onBatchDeleted={handleBatchDeleted}
            onShareBatch={handleOpenShareModal}
          />
        )}
      </div>

      <ShareReportsModal
        isOpen={shareModalOpen}
        onClose={handleCloseShareModal}
        batch={selectedBatch}
        onShared={handleShareSuccess}
      />
    </main>
  );
}

