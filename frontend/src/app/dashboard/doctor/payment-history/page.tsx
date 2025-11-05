"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function PaymentHistoryPage() {
  const { user: _user } = useAuth();

  return (
    <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment History</h1>
        <p className="text-gray-600">Payment history content will be added here.</p>
      </div>
    </main>
  );
}

