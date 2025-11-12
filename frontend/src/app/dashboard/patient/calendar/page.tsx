"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  calendarAPI,
  CalendarEventsResponse,
  GoogleCalendarEvent,
} from "@/services/api";

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const holidayColor = "#F43F5E";

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  events: GoogleCalendarEvent[];
  holidays: GoogleCalendarEvent[];
};

const monthBounds = (anchor: Date) => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(last);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  return { first, last, gridStart, gridEnd };
};

const toStartOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const toEndOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const buildMatrix = (
  anchor: Date,
  events: CalendarEventsResponse | null
): CalendarDay[] => {
  const { first, last, gridStart, gridEnd } = monthBounds(anchor);
  const days: CalendarDay[] = [];
  const cursor = new Date(gridStart);
  const eventBucket = new Map<
    string,
    { events: GoogleCalendarEvent[]; holidays: GoogleCalendarEvent[] }
  >();

  const registerEvent = (iso: string, event: GoogleCalendarEvent, isHoliday = false) => {
    if (!eventBucket.has(iso)) {
      eventBucket.set(iso, { events: [], holidays: [] });
    }
    const bucket = eventBucket.get(iso)!;
    if (isHoliday) bucket.holidays.push(event);
    else bucket.events.push(event);
  };

  for (const event of events?.primary ?? []) {
    const iso =
      (event.start?.dateTime ?? event.start?.date ?? "").split("T")[0];
    if (iso) registerEvent(iso, event, false);
  }
  for (const holiday of events?.holidays ?? []) {
    const iso =
      (holiday.start?.dateTime ?? holiday.start?.date ?? "").split("T")[0];
    if (iso) registerEvent(iso, holiday, true);
  }

  while (cursor <= gridEnd) {
    const iso = cursor.toISOString().split("T")[0];
    const bucket = eventBucket.get(iso) ?? { events: [], holidays: [] };
    days.push({
      date: new Date(cursor),
      inCurrentMonth: cursor >= first && cursor <= last,
      events: bucket.events,
      holidays: bucket.holidays,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);

const formatEventTime = (event: GoogleCalendarEvent) => {
  const value = event.start?.dateTime ?? event.start?.date;
  if (!value) return "All day";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export default function PatientCalendarPage() {
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeHolidays, setIncludeHolidays] = useState(true);

  const { first, last } = useMemo(() => monthBounds(anchorDate), [anchorDate]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await calendarAPI.listEvents({
        timeMin: toStartOfDay(first).toISOString(),
        timeMax: toEndOfDay(last).toISOString(),
        includeHolidays,
        maxResults: 200,
      });
      setEvents(result);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load your calendar."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate, includeHolidays]);

  const matrix = useMemo(
    () => buildMatrix(anchorDate, events),
    [anchorDate, events]
  );

  const upcomingVisits = useMemo(() => {
    const list = events?.primary ?? [];
    return list
      .map((event) => ({
        event,
        start: event.start?.dateTime
          ? new Date(event.start.dateTime)
          : event.start?.date
          ? new Date(event.start.date)
          : null,
      }))
      .filter((item) => item.start && item.start >= new Date())
      .sort((a, b) => (a.start!.getTime() - b.start!.getTime()))
      .slice(0, 8);
  }, [events]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#ECF4F9] p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
          <p className="text-gray-600">
            All appointments from your Google Calendar appear here automatically.
          </p>
        </div>
        <Link
          href="/dashboard/patient/appointments"
          className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-50"
        >
          Back to Appointments
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setAnchorDate(
                    new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1)
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Previous
              </button>
              <div className="text-lg font-semibold text-slate-900">
                {monthLabel(anchorDate)}
              </div>
              <button
                type="button"
                onClick={() =>
                  setAnchorDate(
                    new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1)
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeHolidays}
                onChange={(e) => setIncludeHolidays(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Show holidays
            </label>
          </div>

          <div className="grid grid-cols-7 gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {weekdayShort.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-3 text-sm">
            {matrix.map((day) => {
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day.date.toISOString()}
                  className={`min-h-[120px] rounded-2xl border p-3 transition ${
                    day.inCurrentMonth
                      ? "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                      : "border-transparent bg-slate-50 text-slate-400"
                  } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>{day.date.getDate()}</span>
                    {isToday && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-700"
                      >
                        <div className="font-semibold">{event.summary || "Untitled"}</div>
                        <div className="text-[11px] text-blue-600">
                          {formatEventTime(event)}
                        </div>
                      </div>
                    ))}
                    {day.holidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="rounded-xl border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-600"
                      >
                        Holiday: {holiday.summary}
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{day.events.length - 3} more…
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Upcoming visits
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {upcomingVisits.length === 0 ? (
              <p className="text-sm text-slate-500">
                No appointments scheduled. Your confirmed visits will appear here.
              </p>
            ) : (
              upcomingVisits.map(({ event, start }) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <div className="font-semibold text-slate-900">
                    {event.summary || "Untitled appointment"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {start
                      ? new Intl.DateTimeFormat("en", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(start)
                      : "All day"}
                  </div>
                  {event.location && (
                    <div className="text-xs text-slate-500">
                      Location: {event.location}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {includeHolidays && (events?.holidays?.length ?? 0) > 0 && (
            <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              <div className="mb-1 font-semibold">Upcoming holidays</div>
              <ul className="space-y-1 text-xs">
                {(events?.holidays ?? []).slice(0, 5).map((holiday) => (
                  <li key={holiday.id} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: holidayColor }}
                    />
                    <span>
                      {holiday.summary} –{" "}
                      {holiday.start?.date
                        ? new Date(holiday.start.date).toDateString()
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {loading && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Syncing with Google Calendar…
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
    </main>
  );
}


