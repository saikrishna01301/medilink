"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { notificationAPI, Notification, APIError } from "@/services/api";

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [notifs, count] = await Promise.all([
        notificationAPI.list({ limit: 20 }),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count.count);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail);
      } else {
        setError("Failed to load notifications");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId
            ? { ...n, status: "read", read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read", read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleArchive = async (notificationId: number) => {
    try {
      await notificationAPI.archive(notificationId);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
    } catch (err) {
      console.error("Failed to archive notification:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className || ""}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-800 relative"
        aria-label="Notifications"
      >
        <Image src="/icons/bell.svg" alt="Notifications" width={20} height={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-600">{error}</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.notification_id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        notification.status === "unread" ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        if (notification.type === "appointment_request" && notification.appointment_request_id) {
                          router.push("/dashboard/doctor/appointments");
                          setIsOpen(false);
                        } else if (
                          (notification.type === "appointment_suggested" || 
                           notification.type === "appointment_accepted" || 
                           notification.type === "appointment_rejected") && 
                          notification.appointment_request_id
                        ) {
                          router.push("/dashboard/patient/appointments");
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            {notification.status === "unread" && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {notification.status === "unread" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.notification_id);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(notification.notification_id);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                            title="Archive"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

