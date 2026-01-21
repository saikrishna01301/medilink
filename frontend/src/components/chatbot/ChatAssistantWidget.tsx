"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  streamAssistantReplay,
  fetchChatHistory,
  fetchLastMessage,
  fetchPrepareKB,
} from "@/services/api";
import DoctorCardsList, {
  DoctorCard,
} from "@/components/chatbot/DoctorCardsList";
import AssistantMessage from "@/components/chatbot/assistantMessage";
import AssistantUserMessage from "@/components/chatbot/assistantUserMessage";

// Roles used by the chat backend. "medilink" is treated as assistant on send.
type ChatRole = "assistant" | "user" | "medilink";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  citations?: { text: string; file_name: string }[];
};

// Floating chat assistant for dashboards. UI stays in Next; responses stream from backend.
export default function ChatAssistantWidget() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<DoctorCard | null>(null);
  const [bookingMessageId, setBookingMessageId] = useState<string | null>(null);

  // Ensure portal only renders on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Send message and stream assistant reply into a placeholder bubble
  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = overrideText ?? input;
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    // Create user message
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const updatedMessages = [...messages, userMessage];
    const botId = `a-${Date.now()}`;

    // Stage user + placeholder assistant together to avoid state races
    setMessages([
      ...updatedMessages,
      { id: botId, role: "medilink", content: "" },
    ]);
    setInput("");

    let streamedText = "";

    try {
      // Adapt UI messages (text) to API shape (content)
      const outbound = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await streamAssistantReplay(outbound, (chunk: string) => {
        streamedText += chunk;
        setMessages((prev) => {
          const cloned = [...prev];
          const idx = cloned.findIndex((m) => m.id === botId);
          if (idx !== -1)
            cloned[idx] = { ...cloned[idx], content: streamedText };
          return cloned;
        });
      });

      // Reset if assistant signals clear
      if (streamedText.toLowerCase().includes("chat cleared successfully")) {
        setMessages([]);
        setInput("");
        setIsSending(false);
        return;
      }

      // Attach citations from server
      const last = await fetchLastMessage();
      setMessages((prev) => {
        const cloned = [...prev];
        const idx = cloned.findIndex((m) => m.id === botId);
        if (idx !== -1) {
          cloned[idx] = {
            ...cloned[idx],
            citations: last?.citations || [],
          };
        }
        return cloned;
      });
    } catch (error) {
      console.error("Chat send error:", error);
      setMessages((prev) => {
        const cloned = [...prev];
        const idx = cloned.findIndex((m) => m.id === botId);
        if (idx !== -1) {
          cloned[idx] = {
            ...cloned[idx],
            content: "Sorry, I hit a snag. Please try again.",
          };
        }
        return cloned;
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // Book CTA from doctor cards feeds back into chat to trigger backend tool
  //Both functions can pass to AssistantMessage here we only choose Auto send
  //auto sends the user message after clicking on book appointment
  const handleBookDoctor = (doc: DoctorCard, messageId: string) => {
    setBookingDoctor(doc);
    setShowBookingForm(true);
    setBookingMessageId(messageId);
  };

  //it sents the text in input field the user has to manipulate and send it.
  const handleSelectDoctor = (doc: DoctorCard) => {
    // setInput(`I want to book with ${doc.name}`);
  };

  // Parse an assistant message as a doctor list payload
  const extractDoctorList = (raw: string): DoctorCard[] | null => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.type === "DOCTOR_LIST" && Array.isArray(parsed.doctors)) {
        return (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsed.doctors?.map((r: any, idx: number) => ({
            doctor_user_id: r.doctor_user_id ?? idx,
            clinic_id: r.clinic_id ?? null,
            name: r.name ?? "Doctor",
            specialty: r.specialty ?? r.primary_specialty ?? "",
            clinic_name: r.clinic_name ?? "",
            next_available: r.next_available ?? "",
            avatar: r.photo_url ?? r.avatar ?? null,
          })) || []
        );
      }
    } catch (_) {
      /* ignore */
    }
    return null;
  };

  const userAvatar = user?.photo_url;
  const userInitial = (
    user?.first_name?.[0] ||
    user?.email?.[0] ||
    "Y"
  ).toUpperCase();

  // Booking form handlers
  const handleSubmitBooking = (data: {
    date: string;
    time: string;
    isFlexible: boolean;
    reason: string;
    notes: string;
  }) => {
    if (!bookingDoctor) return;
    const safeName = (bookingDoctor.name || "Doctor").replace(/\s+/g, "_");
    const machineMsg = `Book appointment with doctor_user_id=${bookingDoctor.doctor_user_id} doctor_name=${safeName} clinic_id=${bookingDoctor.clinic_id ?? ""} preferred_date=${data.date} preferred_time_slot_start=${data.time} is_flexible=${data.isFlexible} reason=${data.reason} notes=${data.notes}`;
    const displayMsg = `Booking request for Dr. ${bookingDoctor.name} on ${data.date} at ${data.time} (${data.isFlexible ? "flexible" : "fixed"}). Reason: ${data.reason}${data.notes ? ` | Notes: ${data.notes}` : ""}`;
    handleSend(undefined, machineMsg);
    // Replace the just-added user message content with a friendly summary
    setMessages((prev) => {
      const cloned = [...prev];
      // last user message is the one we just pushed
      for (let i = cloned.length - 1; i >= 0; i--) {
        if (cloned[i].role === "user") {
          cloned[i] = { ...cloned[i], content: displayMsg };
          break;
        }
      }
      return cloned;
    });
    setShowBookingForm(false);
    setBookingDoctor(null);
    setBookingMessageId(null);
  };

  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setBookingDoctor(null);
    setBookingMessageId(null);
  };

  useEffect(() => {
    // Prepare KB and preload chat history
    const init = async () => {
      try {
        await fetchPrepareKB();
      } catch (error) {
        console.error("Error preparing knowledge base:", error);
      }

      try {
        const res = await fetchChatHistory();
        const history = Array.isArray(res?.data) ? res.data : [];
        const normalized: ChatMessage[] = history.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (msg: any, idx: number) => ({
            id: `hist-${idx}`,
            role: msg.role === "assistant" ? "medilink" : msg.role,
            content: msg.content || msg.text || "",
            citations: msg.citations || [],
          })
        );
        if (normalized.length) {
          setMessages(normalized);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };

    init();
  }, []);

  return (
    <>
      {mounted &&
        createPortal(
          <>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-full bg-black px-4 py-3 text-white shadow-lg ring-2 ring-white/70 transition hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300"
              aria-expanded={isOpen}
              aria-controls="chatbot-panel"
            >
              <Image
                src="/favicon.png"
                alt="Chatbot"
                width={28}
                height={28}
                className="rounded-full"
              />
              <span className="text-sm font-semibold">Ask me</span>
            </button>

            {isOpen && (
              <div
                id="chatbot-panel"
                className="fixed bottom-24 right-6 z-[2000] w-[92vw] max-w-[420px] h-[540px] max-h-[80vh] overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-[0_12px_30px_-16px_rgba(0,0,0,0.45)] transition-all"
              >
                <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-900 via-gray-800 to-black px-4 py-3 text-white">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-white/10 p-1">
                      <Image
                        src="/favicon.png"
                        alt="MediLink"
                        fill
                        sizes="36px"
                        className="rounded-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        MediLink Assistant
                      </p>
                      <p className="flex items-center gap-2 text-[11px] text-white/70">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
                        Live support
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                    aria-label="Close chatbot"
                  >
                    ×
                  </button>
                </div>
                <div className="flex h-[calc(100%-52px)] min-h-0 flex-col bg-white">
                  <div className="flex-1 min-h-0 space-y-4 overflow-y-auto bg-gradient-to-b from-white via-white to-gray-50 px-4 py-4">
                    {messages.map((message) => {
                      const isUser = message.role === "user";
                      const doctorList =
                        !isUser && message.content
                          ? extractDoctorList(message.content)
                          : null;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isUser ? "justify-end" : "justify-start"
                          } items-start gap-3`}
                        >
                          {isUser ? (
                            <AssistantUserMessage
                              message={message}
                              userAvatar={userAvatar}
                              userInitial={userInitial}
                            />
                          ) : (
                            <AssistantMessage
                              message={message}
                              doctorList={doctorList}
                              onBookDoctor={(doc) =>
                                handleBookDoctor(doc, message.id)
                              }
                              onSelectDoctor={handleSelectDoctor}
                              showBookingForm={showBookingForm}
                              bookingDoctor={bookingDoctor}
                              bookingMessageId={bookingMessageId}
                              onSubmitBooking={handleSubmitBooking}
                              onCancelBooking={handleCancelBooking}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3 mb-3">
                    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 shadow-inner">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything…"
                        className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </>
  );
}
