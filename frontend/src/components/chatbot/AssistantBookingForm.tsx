import React, { useState } from "react";
import { DoctorCard } from "./DoctorCardsList";

type BookingFormProps = {
  doctor: DoctorCard;
  onSubmit: (data: {
    date: string;
    time: string;
    isFlexible: boolean;
    reason: string;
    notes: string;
  }) => void;
  onCancel: () => void;
};

export default function AssistantBookingForm({
  doctor,
  onSubmit,
  onCancel,
}: BookingFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ date, time, isFlexible, reason, notes });
      }}
    >
      <div className="text-sm font-semibold text-gray-900">
        Book with {doctor.name}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600">Date</span>
          <input
            type="date"
            className="rounded-md border border-gray-300 px-2 py-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600">Time</span>
          <input
            type="time"
            className="rounded-md border border-gray-300 px-2 py-1"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFlexible}
          onChange={(e) => setIsFlexible(e.target.checked)}
        />
        <span>Flexible on date/time</span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs text-gray-600">Reason</span>
        <input
          type="text"
          className="rounded-md border border-gray-300 px-2 py-1"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., skin rash consultation"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs text-gray-600">Notes (optional)</span>
        <textarea
          className="rounded-md border border-gray-300 px-2 py-1"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </label>
      <div className="flex justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1 text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-black px-3 py-1 text-white"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
