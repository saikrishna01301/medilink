"use client";

import { FileBatch, PatientFile } from "@/services/api";

interface FileTimelineSectionProps {
  batches: FileBatch[];
  onBatchDeleted?: () => void;
  onDeleteFile?: (fileId: number) => void;
  onShareBatch?: (batch: FileBatch) => void;
}

export default function FileTimelineSection({ batches, onBatchDeleted, onDeleteFile, onShareBatch }: FileTimelineSectionProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName} ${month} ${day} ${year}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType === "application/pdf") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getDateLabel = (dateString: string, index: number, allBatches: FileBatch[]): string | null => {
    if (index === 0) return "Today";
    
    const currentDate = new Date(dateString);
    const previousDate = index > 0 ? new Date(allBatches[index - 1].created_at) : null;
    
    if (!previousDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);
    const previous = new Date(previousDate);
    previous.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return null; // Already marked as Today
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // Only show label if different date from previous
    if (current.getTime() !== previous.getTime()) {
      return formatDate(dateString);
    }
    
    return null;
  };

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
        <p className="text-gray-500">No files uploaded yet. Upload your first batch above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload History</h2>
      
      {batches.map((batch, index) => {
        const dateLabel = getDateLabel(batch.created_at, index, batches);
        const batchCategory = batch.category === "insurance" ? "Insurance" : "Lab Report";
        
        return (
          <div key={batch.id} className="relative">
            {/* Date Label */}
            {dateLabel && (
              <div className="flex justify-center mb-6">
                <span className="bg-green-100 text-green-800 px-6 py-1.5 rounded-full text-sm font-medium">
                  {dateLabel}
                </span>
              </div>
            )}

            <div className="flex gap-6 pb-8">
              {/* Date/Time */}
              <div className="w-32 text-right flex-shrink-0">
                <div className="text-pink-500 font-medium text-sm">{formatDate(batch.created_at)}</div>
                <div className="text-pink-500 font-medium text-sm">{formatTime(batch.created_at)}</div>
              </div>

              {/* Timeline Dot and Line */}
              <div className="relative flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-pink-500 ring-4 ring-pink-100 z-10"></div>
                {index < batches.length - 1 && (
                  <div className="w-0.5 h-full bg-pink-200 absolute top-3"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-semibold text-blue-600">{batchCategory}</span>
                      {batch.heading && (
                        <span className="font-medium text-gray-900">{batch.heading}</span>
                      )}
                      <span className="text-sm text-gray-500">
                        {batch.files.length} file{batch.files.length !== 1 ? "s" : ""}
                      </span>
                      {batch.category === "lab_report" && onShareBatch && (
                        <button
                          onClick={() => onShareBatch(batch)}
                          className="ml-auto inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 10-3-3m-3 11a3 3 0 103 3m0-9l3-3m-3 3l-3-3m3 3l3 3m-3-3l-3 3" />
                          </svg>
                          Share
                        </button>
                      )}
                    </div>
                    
                    {/* Files List */}
                    <div className="space-y-2 mt-3">
                      {batch.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <div className="text-gray-600">
                            {getFileIcon(file.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                            >
                              {file.file_name}
                            </a>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.file_size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            {onDeleteFile && (
                              <button
                                onClick={() => onDeleteFile(file.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Delete file"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

