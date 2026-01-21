import React from "react";

export type DoctorCard = {
  doctor_user_id: number;
  clinic_id?: number | null;
  name: string;
  specialty?: string | null;
  clinic_name?: string | null;
  next_available?: string | null;
  avatar?: string | null;
};

type DoctorCardsListProps = {
  doctors: DoctorCard[];
  onBook?: (doctor: DoctorCard) => void;
  onSelect?: (doctor: DoctorCard) => void;
};

const Avatar: React.FC<{ name: string; avatar?: string | null }> = ({
  name,
  avatar,
}) => {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
      {initial}
    </div>
  );
};

/**
 * Compact doctor cards for the chat assistant.
 */
export function DoctorCardsList({
  doctors,
  onBook,
  onSelect,
}: DoctorCardsListProps) {
  if (!doctors?.length) return null;

  return (
    <div className="space-y-3">
      {doctors.map((doc) => (
        <div
          key={`${doc.doctor_user_id}-${doc.clinic_id ?? "na"}`}
          className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
        >
          <button
            type="button"
            onClick={() => onSelect?.(doc)}
            className="flex flex-1 items-center gap-3 text-left focus:outline-none"
          >
            <Avatar name={doc.name} avatar={doc.avatar} />
            <div>
              <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
              <p className="text-xs text-gray-600">
                {doc.specialty || "Specialty not set"}
              </p>
              {doc.clinic_name && (
                <p className="text-[11px] text-gray-500">{doc.clinic_name}</p>
              )}
              {doc.next_available && (
                <p className="text-[11px] text-emerald-600">
                  Next available: {doc.next_available}
                </p>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onBook?.(doc)}
            className="ml-3 inline-flex items-center rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Book appointment
          </button>
        </div>
      ))}
    </div>
  );
}

export default DoctorCardsList;
