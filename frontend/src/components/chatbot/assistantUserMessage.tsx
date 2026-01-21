import Image from "next/image";

type ChatRole = "assistant" | "user" | "medilink";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  citations?: { text: string; file_name: string }[];
};

type AssistantUserMessageProps = {
  message: ChatMessage;
  userAvatar?: string | null;
  userInitial: string;
};

export default function AssistantUserMessage({
  message,
  userAvatar,
  userInitial,
}: AssistantUserMessageProps) {
  const formatBookingMessage = (content: string) => {
    const marker = "Book appointment with doctor_user_id=";
    if (!content.startsWith(marker)) return content;

    const name =
      content.match(/doctor_name=([^\s]+)/)?.[1]?.replace(/_/g, " ") ||
      content.match(/doctor=([^\s]+)/)?.[1]?.replace(/_/g, " ") ||
      (content.match(/doctor_user_id=([0-9]+)/)?.[1]
        ? `Doctor #${content.match(/doctor_user_id=([0-9]+)/)?.[1]}`
        : "Doctor");
    const date = content.match(/preferred_date=([^\s]+)/)?.[1] || "";
    const time = content.match(/preferred_time_slot_start=([^\s]+)/)?.[1] || "";

    const summary = `Booking request for ${name}${
      date || time ? " on " : ""
    }${date}${date && time ? " at " : date ? "" : time ? " at " : ""}${time}`;
    return `${summary}\n\n${content}`;
  };

  const displayContent = formatBookingMessage(message.content);

  return (
    <>
      <div className="max-w-[75%] rounded-2xl bg-gray-900 px-3 py-2 text-sm text-white shadow-sm">
        {displayContent}
      </div>
      <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
        {userAvatar ? (
          <Image
            src={userAvatar}
            alt="You"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-300">
            {userInitial}
          </div>
        )}
      </div>
    </>
  );
}
