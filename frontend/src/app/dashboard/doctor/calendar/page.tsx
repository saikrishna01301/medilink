"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  calendarAPI,
  CalendarEventsResponse,
  CreateCalendarEventRequest,
  GoogleCalendarEvent,
} from "@/services/api";
import {
  atEndOfDay,
  atStartOfDay,
  formatDateKey,
  getEventDate,
  getEventDateKey,
  getMonthGridBounds,
} from "@/utils/calendar";

type CategoryOption = {
  value: "appointment" | "task" | "personal";
  label: string;
  color: string;
  colorId: string;
};

const categoryOptions: CategoryOption[] = [
  { value: "appointment", label: "Consultation", color: "#2563EB", colorId: "1" },
  { value: "task", label: "To-do", color: "#F97316", colorId: "6" },
  { value: "personal", label: "Personal", color: "#6366F1", colorId: "2" },
];

const holidayCategory = { value: "holiday", label: "Holiday", color: "#F43F5E" };

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  events: GoogleCalendarEvent[];
  holidays: GoogleCalendarEvent[];
};

const buildMatrix = (
  anchor: Date,
  events: CalendarEventsResponse | null
): CalendarDay[] => {
  const { firstOfMonth, lastOfMonth, gridStart, gridEnd } =
    getMonthGridBounds(anchor);
  const days: CalendarDay[] = [];
  const cursor = new Date(gridStart);
  const eventMap = new Map<string, { events: GoogleCalendarEvent[]; holidays: GoogleCalendarEvent[] }>();

  const addEvent = (isoDate: string, event: GoogleCalendarEvent, isHoliday = false) => {
    if (!eventMap.has(isoDate)) {
      eventMap.set(isoDate, { events: [], holidays: [] });
    }
    const bucket = eventMap.get(isoDate)!;
    if (isHoliday) {
      bucket.holidays.push(event);
    } else {
      bucket.events.push(event);
    }
  };

  for (const event of events?.primary ?? []) {
    const key = getEventDateKey(event);
    if (key) addEvent(key, event, false);
  }

  for (const holiday of events?.holidays ?? []) {
    const key = getEventDateKey(holiday);
    if (key) addEvent(key, holiday, true);
  }

  while (cursor <= gridEnd) {
    const key = formatDateKey(cursor);
    const bucket = eventMap.get(key) ?? { events: [], holidays: [] };
    days.push({
      date: new Date(cursor),
      inCurrentMonth: cursor >= firstOfMonth && cursor <= lastOfMonth,
      events: bucket.events,
      holidays: bucket.holidays,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getCategoryFromEvent = (event: GoogleCalendarEvent): CategoryOption | typeof holidayCategory | null => {
  const extended = (event as any)?.extendedProperties?.private;
  const categoryKey = extended?.medilinkCategory || extended?.category;
  if (categoryKey) {
    const match = categoryOptions.find((opt) => opt.value === categoryKey);
    if (match) return match;
  }
  if ((event.summary || "").toLowerCase().includes("holiday")) {
    return holidayCategory;
  }
  return null;
};

const formatEventTime = (event: GoogleCalendarEvent) => {
  const start = getEventDate(event, "start");
  const end = getEventDate(event, "end");
  if (!start) return "All day";
  if (!event.end?.dateTime && event.start?.date) {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
    }).format(start);
  }
  if (!end) {
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(start);
  }
  const formatter = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(start)} → ${formatter.format(end)}`;
};

export default function DoctorCalendarPage() {
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeHolidays, setIncludeHolidays] = useState(true);
  const [clock, setClock] = useState(() => new Date());
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    category: categoryOptions[0].value,
    isAllDay: false,
  });
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { firstOfMonth, lastOfMonth } = useMemo(
    () => getMonthGridBounds(anchorDate),
    [anchorDate]
  );

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarAPI.listEvents({
        timeMin: atStartOfDay(firstOfMonth).toISOString(),
        timeMax: atEndOfDay(lastOfMonth).toISOString(),
        includeHolidays,
        maxResults: 500,
      });
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unable to load calendar events."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate, includeHolidays]);

  const matrix = useMemo(
    () => buildMatrix(anchorDate, events),
    [anchorDate, events]
  );

  const upcomingEvents = useMemo(() => {
    const all = [
      ...(events?.primary ?? []),
      ...(includeHolidays ? events?.holidays ?? [] : []),
    ];
    const now = new Date();
    return all
      .map((event) => ({
        event,
        start: getEventDate(event, "start"),
      }))
      .filter((item) => item.start && item.start >= now)
      .sort((a, b) => (a.start!.getTime() - b.start!.getTime()))
      .slice(0, 10);
  }, [events, includeHolidays]);

  const todos = useMemo(() => {
    const primary = events?.primary ?? [];
    return primary.filter((event) => {
      const category = getCategoryFromEvent(event);
      if (category?.value === "task") return true;
      const summary = (event.summary || "").toLowerCase();
      return summary.includes("todo") || summary.includes("task");
    });
  }, [events]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    setSuccessMessage(null);
    try {
      const selectedCategory = categoryOptions.find(
        (opt) => opt.value === formState.category
      )!;
      const startDate = new Date(`${formState.date}T${formState.startTime}`);
      const endDate = new Date(`${formState.date}T${formState.endTime}`);

      const payload: CreateCalendarEventRequest = formState.isAllDay
        ? {
            summary: formState.title,
            description: formState.description,
            start: { date: formState.date },
            end: { date: formState.date },
            colorId: selectedCategory.colorId,
            extendedProperties: {
              private: {
                medilinkCategory: selectedCategory.value,
              },
            },
          }
        : {
            summary: formState.title,
            description: formState.description,
            start: { dateTime: startDate.toISOString() },
            end: { dateTime: endDate.toISOString() },
            colorId: selectedCategory.colorId,
            extendedProperties: {
              private: {
                medilinkCategory: selectedCategory.value,
              },
            },
          };

      await calendarAPI.createEvent(payload);
      setSuccessMessage("Event added to Google Calendar.");
      setFormState((prev) => ({
        ...prev,
        title: "",
        description: "",
      }));
      await fetchEvents();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#ECF4F9] p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar & Planner</h1>
          <p className="text-gray-600">
            Syncs directly with your Google Calendar. Create appointments, track todos, and stay on schedule.
          </p>
        </div>
        <Link
          href="/dashboard/doctor/appointments"
          className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-50"
        >
          Back to Overview
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Main Calendar Panel */}
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
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={includeHolidays}
                  onChange={(e) => setIncludeHolidays(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Show holidays
              </label>
            </div>
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
              const isToday =
                day.date.toDateString() === new Date().toDateString();
              const categoryDots = day.events
                .map((event) => getCategoryFromEvent(event))
                .filter(Boolean) as CategoryOption[];
              const limitedDots = categoryDots.slice(0, 4);

              return (
                <div
                  key={day.date.toISOString()}
                  className={`min-h-[140px] rounded-2xl border p-3 transition ${
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
                  <div className="mt-2 flex flex-wrap gap-1">
                    {limitedDots.map((dot, index) => (
                      <span
                        key={`${dot.value}-${index}`}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: dot.color }}
                        title={dot.label}
                      />
                    ))}
                    {day.holidays.length > 0 && (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: holidayCategory.color }}
                        title="Holiday"
                      />
                    )}
                    {categoryDots.length + day.holidays.length > limitedDots.length + day.holidays.length && (
                      <span className="text-xs text-slate-400">
                        +{categoryDots.length - limitedDots.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {day.events.slice(0, 3).map((event) => {
                      const category = getCategoryFromEvent(event);
                      return (
                        <div
                          key={event.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {category && (
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            <span className="font-medium text-slate-700">
                              {event.summary || "Untitled"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatEventTime(event)}
                          </div>
                        </div>
                      );
                    })}
                    {day.events.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{day.events.length - 3} more…
                      </div>
                    )}
                    {day.holidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-600"
                      >
                        Holiday: {holiday.summary}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Planner & Actions */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Create event / task
              </h2>
              <span className="text-3xl font-bold text-slate-700">
                {new Intl.DateTimeFormat("en", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(clock)}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              New entries sync instantly with Google Calendar.
            </p>

            <form className="mt-4 space-y-3" onSubmit={submitEvent}>
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formState.title}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Post-surgery follow-up"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Add notes, preparation details, or agenda…"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formState.date}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formState.category}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Start time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formState.startTime}
                    onChange={handleFormChange}
                    disabled={formState.isAllDay}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    End time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formState.endTime}
                    onChange={handleFormChange}
                    disabled={formState.isAllDay}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  name="isAllDay"
                  checked={formState.isAllDay}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                All-day event
              </label>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {creating ? "Saving…" : "Save to Google Calendar"}
              </button>
            </form>

            {successMessage && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {successMessage}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Upcoming events
            </h2>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-slate-500">No events scheduled yet.</p>
              )}
              {upcomingEvents.map(({ event, start }) => {
                const category = getCategoryFromEvent(event);
                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{event.summary || "Untitled"}</span>
                      {category && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${category.color}1A`,
                            color: category.color,
                          }}
                        >
                          {category.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
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
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Active to-dos
            </h2>
            {todos.length === 0 ? (
              <p className="text-sm text-slate-500">
                No tasks yet. Create a new event and mark it as “To-do” to track it here.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-start justify-between rounded-xl border border-orange-100 bg-orange-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-orange-600">
                        {todo.summary || "Untitled task"}
                      </p>
                      <p className="text-xs text-orange-500">
                        {formatEventTime(todo)}
                      </p>
                    </div>
                    <span className="text-xs text-orange-400">
                      {(() => {
                        const date = getEventDate(todo, "start");
                        return date
                          ? new Intl.DateTimeFormat("en", {
                              month: "short",
                              day: "numeric",
                            }).format(date)
                          : "";
                      })()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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


