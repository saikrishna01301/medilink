import Image from "next/image";
import DoctorCardsList, { DoctorCard } from "./DoctorCardsList";
import AssistantBookingForm from "./AssistantBookingForm";
import ContentRenderer from "./AssistantContentRenderer";

type ChatRole = "assistant" | "user" | "medilink";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  citations?: { text: string; file_name: string }[];
};

type AssistantMessageProps = {
  message: ChatMessage;
  doctorList: DoctorCard[] | null;
  onBookDoctor: (doc: DoctorCard) => void;
  onSelectDoctor: (doc: DoctorCard) => void;
  showBookingForm: boolean;
  bookingDoctor: DoctorCard | null;
  bookingMessageId: string | null;
  onSubmitBooking: (data: {
    date: string;
    time: string;
    isFlexible: boolean;
    reason: string;
    notes: string;
  }) => void;
  onCancelBooking: () => void;
};

export default function AssistantMessage({
  message,
  doctorList,
  onBookDoctor,
  onSelectDoctor,
  showBookingForm,
  bookingDoctor,
  bookingMessageId,
  onSubmitBooking,
  onCancelBooking,
}: AssistantMessageProps) {
  return (
    <>
      <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-900/10 p-1">
        <Image
          src="/favicon.png"
          alt="MediLink"
          width={28}
          height={28}
          className="rounded-full"
        />
      </div>
      <div className="max-w-[75%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-800 shadow-sm">
        {" "}
        {doctorList ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">
              Doctors you can book
            </p>
            <DoctorCardsList
              doctors={doctorList}
              onBook={onBookDoctor}
              onSelect={onSelectDoctor}
            />
            {showBookingForm &&
              bookingDoctor &&
              bookingMessageId === message.id && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <AssistantBookingForm
                    doctor={bookingDoctor}
                    onSubmit={onSubmitBooking}
                    onCancel={onCancelBooking}
                  />
                </div>
              )}
          </div>
        ) : (
          <>
            <ContentRenderer rawContent={message.content} />

            {/* {message.citations && message.citations.length > 0 && (
              <div className="mt-2 space-y-1 rounded-xl bg-white/80 px-2 py-1 text-xs text-gray-700 shadow-inner">
                <p className="font-semibold text-gray-800">Sources</p>

                {message.citations.map((c, i) => (
                  <div key={`${message.id}-cit-${i}`}>
                    • {c.file_name || c.text}
                  </div>
                ))}
              </div>
            )} */}
          </>
        )}
      </div>
    </>
  );
}
