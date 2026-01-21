"use client";

import { useState, useRef } from "react";
import { patientFileAPI, FileBatch } from "@/services/api";

interface FileUploadSectionProps {
  category: "insurance" | "lab_report";
  onUploadSuccess: (batch: FileBatch) => void;
}

export default function FileUploadSection({ category, onUploadSuccess }: FileUploadSectionProps) {
  const [heading, setHeading] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name} is not a valid file type. Only images and PDFs are allowed.`);
        continue;
      }
      if (file.size > maxSize) {
        setError(`${file.name} exceeds 10MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log(`Uploading ${selectedFiles.length} files for category: ${category}`);
      const batch = await patientFileAPI.uploadFiles(
        category,
        selectedFiles,
        heading.trim() || undefined
      );
      console.log("Upload successful:", batch);
      onUploadSuccess(batch);
      // Reset form
      setSelectedFiles([]);
      setHeading("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      // Handle APIError - it has both detail and message properties
      const errorObj = err as { detail?: string; message?: string };
      if (err && typeof err === 'object') {
        // Check if it's an APIError (has detail property)
        if ('detail' in errorObj && typeof errorObj.detail === 'string') {
          setError(errorObj.detail);
        } else if (errorObj.message && typeof errorObj.message === 'string') {
          setError(errorObj.message);
        } else {
          setError("Failed to upload files. Please try again.");
        }
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("Failed to upload files. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Upload {category === "insurance" ? "Insurance" : "Lab Report"} Files
      </h2>

      {/* Batch Heading Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Batch Heading (Optional)
        </label>
        <input
          type="text"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="e.g., Annual Checkup 2024, Insurance Claim #12345"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600">
            Drag and drop files here, or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: Images (JPEG, PNG, WebP, GIF) and PDF. Max 10MB per file.
          </p>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-600 hover:text-red-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

