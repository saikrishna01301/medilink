"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function ChatsPage() {
  const { user: _user } = useAuth();

  return (
    <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Chats</h1>
        <p className="text-gray-600">Chats page content will be added here.</p>
      </div>
    </main>
  );
}

