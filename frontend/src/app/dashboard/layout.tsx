"use client";

import ChatAssistantWidget from "@/components/chatbot/ChatAssistantWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <ChatAssistantWidget />
    </div>
  );
}
