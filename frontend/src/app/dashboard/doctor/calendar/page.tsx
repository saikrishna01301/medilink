"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  calendarAPI,
  CalendarEventsResponse,
  Appointment,
  HolidayEvent,
  CreateAppointmentRequest,
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
};

const categoryOptions: CategoryOption[] = [
  { value: "appointment", label: "Consultation", color: "#2563EB" },
  { value: "task", label: "To-do", color: "#F97316" },
  { value: "personal", label: "Personal", color: "#6366F1" },
];

const holidayCategory = { value: "holiday", label: "Holiday", color: "#F43F5E" };

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  appointments: Appointment[];
  holidays: HolidayEvent[];
  shared: HolidayEvent[];
};

const buildMatrix = (
  anchor: Date,
  events: CalendarEventsResponse | null
): CalendarDay[] => {
  const { firstOfMonth, lastOfMonth, gridStart, gridEnd } =
    getMonthGridBounds(anchor);
  const days: CalendarDay[] = [];
  const cursor = new Date(gridStart);
  const eventMap = new Map<
    string,
    { appointments: Appointment[]; holidays: HolidayEvent[]; shared: HolidayEvent[] }
  >();

  const ensureBucket = (key: string) => {
    if (!eventMap.has(key)) {
      eventMap.set(key, { appointments: [], holidays: [], shared: [] });
    }
    return eventMap.get(key)!;
  };

  for (const appointment of events?.appointments ?? []) {
    const key = getEventDateKey(appointment);
    if (key) {
      ensureBucket(key).appointments.push(appointment);
    }
  }

  for (const holiday of events?.holidays ?? []) {
    const key = getEventDateKey(holiday);
    if (key) {
      ensureBucket(key).holidays.push(holiday);
    }
  }

  for (const shared of events?.service_events ?? []) {
    const key = getEventDateKey(shared);
    if (key) {
      ensureBucket(key).shared.push(shared);
    }
  }

  while (cursor <= gridEnd) {
    const key = formatDateKey(cursor);
    const bucket =
      eventMap.get(key) ?? { appointments: [], holidays: [], shared: [] };
    days.push({
      date: new Date(cursor),
      inCurrentMonth: cursor >= firstOfMonth && cursor <= lastOfMonth,
      appointments: bucket.appointments,
      holidays: bucket.holidays,
      shared: bucket.shared,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getCategoryFromEvent = (event: Appointment): CategoryOption | null => {
  if (event.category) {
    const match = categoryOptions.find((opt) => opt.value === event.category);
    if (match) return match;
  }

  const title = (event.title || "").toLowerCase();
  if (title.includes("todo") || title.includes("task")) {
    return categoryOptions.find((opt) => opt.value === "task") ?? null;
  }
  if (
    title.includes("visit") ||
    title.includes("consult") ||
    title.includes("appointment")
  ) {
    return categoryOptions.find((opt) => opt.value === "appointment") ?? null;
  }
  if (title.includes("personal")) {
    return categoryOptions.find((opt) => opt.value === "personal") ?? null;
  }
  return null;
};

const formatAppointmentTime = (event: Appointment) => {
  const start = getEventDate(event, "start");
  const end = getEventDate(event, "end");
  if (!start) return "All day";
  if (event.is_all_day) {
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

const formatHolidayTime = (event: HolidayEvent) => {
  const start = getEventDate(event, "start");
  if (!start) return "";
  const hasTime = event.start?.dateTime;
  const formatter = new Intl.DateTimeFormat("en", hasTime ? {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  } : {
    weekday: "long",
  });
  return formatter.format(start);
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
    const now = new Date();

    const appointmentItems = (events?.appointments ?? []).map((event) => ({
      type: "appointment" as const,
      title: event.title,
      start: getEventDate(event, "start"),
      raw: event,
    }));

    const holidayItems = includeHolidays
      ? (events?.holidays ?? []).map((event) => ({
          type: "holiday" as const,
          title: event.summary ?? "Holiday",
          start: getEventDate(event, "start"),
          raw: event,
        }))
      : [];

    const sharedItems = (events?.service_events ?? []).map((event) => ({
      type: "shared" as const,
      title: event.summary ?? "Shared Event",
      start: getEventDate(event, "start"),
      raw: event,
    }));

    return [...appointmentItems, ...holidayItems, ...sharedItems]
      .filter((item) => item.start && item.start >= now)
      .sort((a, b) => (a.start!.getTime() - b.start!.getTime()))
      .slice(0, 10);
  }, [events, includeHolidays]);

  const todos = useMemo(() => {
    const appointments = events?.appointments ?? [];
    return appointments.filter((event) => {
      const category = getCategoryFromEvent(event);
      if (category?.value === "task") return true;
      const summary = (event.title || "").toLowerCase();
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

      let startIso = startDate.toISOString();
      let endIso = endDate.toISOString();

      if (formState.isAllDay) {
        const startOfDay = new Date(formState.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(formState.date);
        endOfDay.setHours(23, 59, 59, 999);
        startIso = startOfDay.toISOString();
        endIso = endOfDay.toISOString();
      }

      const payload: CreateAppointmentRequest = {
        title: formState.title,
        description: formState.description,
        start_time: startIso,
        end_time: endIso,
        category: selectedCategory.value,
        is_all_day: formState.isAllDay,
      };

      await calendarAPI.createAppointment(payload);
      setSuccessMessage("Appointment saved to MediLink calendar.");
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
            Manage your MediLink schedule with shared clinic events and national holidays.
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
              const categoryDots = day.appointments
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
                    {day.shared.length > 0 && (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: "#0EA5E9" }}
                        title="Shared"
                      />
                    )}
                    {categoryDots.length + day.holidays.length + day.shared.length >
                      limitedDots.length + day.holidays.length + day.shared.length && (
                      <span className="text-xs text-slate-400">
                        +{categoryDots.length - limitedDots.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {day.appointments.slice(0, 3).map((event) => {
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
                              {event.title || "Untitled"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatAppointmentTime(event)}
                          </div>
                        </div>
                      );
                    })}
                    {day.appointments.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{day.appointments.length - 3} more…
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
                    {day.shared.map((shared) => (
                      <div
                        key={shared.id}
                        className="rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 text-xs text-sky-600"
                      >
                        Shared: {shared.summary}
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
              New entries are stored in MediLink and visible to you immediately.
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
                {creating ? "Saving…" : "Save appointment"}
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
              {upcomingEvents.map(({ type, title, start, raw }) => {
                const category =
                  type === "appointment"
                    ? getCategoryFromEvent(raw as Appointment)
                    : null;
                const badgeColor =
                  type === "holiday"
                    ? holidayCategory.color
                    : type === "shared"
                    ? "#0EA5E9"
                    : category?.color;
                const badgeLabel =
                  type === "holiday"
                    ? "Holiday"
                    : type === "shared"
                    ? "Shared"
                    : category?.label;
                const timeLabel =
                  type === "holiday"
                    ? formatHolidayTime(raw as HolidayEvent)
                    : formatAppointmentTime(raw as Appointment);
                return (
                  <div
                    key={`${type}-${(raw as any).id}-${start?.toISOString() ?? "all-day"}`}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{title || "Untitled"}</span>
                      {badgeColor && badgeLabel && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${badgeColor}1A`,
                            color: badgeColor,
                          }}
                        >
                          {badgeLabel}
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
                        : timeLabel}
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
                        {todo.title || "Untitled task"}
                      </p>
                      <p className="text-xs text-orange-500">
                        {formatAppointmentTime(todo)}
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


