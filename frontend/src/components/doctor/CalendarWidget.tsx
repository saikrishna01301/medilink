"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calendarAPI,
  CalendarEventsResponse,
  GoogleCalendarEvent,
} from "@/services/api";

const weekdayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const colorPalette: Record<string, string> = {
  appointment: "#2563EB",
  task: "#F97316",
  personal: "#6366F1",
  default: "#10B981",
  holiday: "#F43F5E",
};

type EventDot = {
  color: string;
  label: string;
};

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  events: EventDot[];
};

const getMonthBounds = (anchor: Date) => {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(lastOfMonth);
  end.setDate(end.getDate() + (6 - end.getDay()));

  return { gridStart: start, gridEnd: end, firstOfMonth, lastOfMonth };
};

const toISODate = (date: Date) => date.toISOString().split("T")[0];

const getEventCategory = (event: GoogleCalendarEvent): EventDot => {
  const extended = (event as any)?.extendedProperties?.private;
  const explicitCategory =
    extended?.medilinkCategory || extended?.category || undefined;
  if (explicitCategory && colorPalette[explicitCategory]) {
    return { color: colorPalette[explicitCategory], label: explicitCategory };
  }

  const summary = (event.summary || "").toLowerCase();
  const colorId = event.colorId ?? "";
  if (event.status === "cancelled") {
    return { color: "#94A3B8", label: "Cancelled" };
  }
  if (summary.includes("todo") || summary.includes("task")) {
    return { color: colorPalette.task, label: "Task" };
  }
  if (summary.includes("visit") || summary.includes("consult") || summary.includes("appointment")) {
    return { color: colorPalette.appointment, label: "Appointment" };
  }
  if (summary.includes("holiday")) {
    return { color: colorPalette.holiday, label: "Holiday" };
  }
  if (colorId) {
    const palette = [
      "#2563EB",
      "#F97316",
      "#8B5CF6",
      "#22C55E",
      "#F43F5E",
      "#0EA5E9",
      "#E11D48",
    ];
    const index = Number.parseInt(colorId, 10);
    if (!Number.isNaN(index)) {
      return {
        color: palette[(index - 1) % palette.length],
        label: "Event",
      };
    }
  }
  return { color: colorPalette.default, label: "Event" };
};

const buildCalendarDays = (
  anchor: Date,
  events: CalendarEventsResponse | null
): CalendarDay[] => {
  const { gridStart, gridEnd, firstOfMonth, lastOfMonth } = getMonthBounds(anchor);

  const dayCursor = new Date(gridStart);
  const days: CalendarDay[] = [];

  const eventMap = new Map<string, EventDot[]>();

  const addEvent = (isoDate: string, dot: EventDot) => {
    if (!eventMap.has(isoDate)) {
      eventMap.set(isoDate, []);
    }
    const existing = eventMap.get(isoDate)!;
    if (!existing.some((item) => item.label === dot.label && item.color === dot.color)) {
      existing.push(dot);
    }
  };

  const eventsList = events?.primary ?? [];
  const holidays = events?.holidays ?? [];

  for (const event of eventsList) {
    const dateKey =
      event.start?.date ??
      (event.start?.dateTime ? event.start.dateTime.split("T")[0] : "");
    if (dateKey) {
      addEvent(dateKey, getEventCategory(event));
    }
  }

  for (const holiday of holidays) {
    const dateKey =
      holiday.start?.date ??
      (holiday.start?.dateTime ? holiday.start.dateTime.split("T")[0] : "");
    if (dateKey) {
      addEvent(dateKey, { color: colorPalette.holiday, label: "Holiday" });
    }
  }

  while (dayCursor <= gridEnd) {
    const iso = toISODate(dayCursor);
    days.push({
      date: new Date(dayCursor),
      inCurrentMonth:
        dayCursor >= firstOfMonth && dayCursor <= lastOfMonth,
      events: eventMap.get(iso) ?? [],
    });
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return days;
};

const formatMonthHeading = (date: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);

const formatRangeLabel = (events: CalendarEventsResponse | null) => {
  if (!events) return "";
  const totalAppointments = events.primary.length;
  const holidayCount = events.holidays.length;
  return `${totalAppointments} events • ${holidayCount} holidays`;
};

export default function CalendarWidget() {
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { firstOfMonth, lastOfMonth } = useMemo(
    () => getMonthBounds(anchorDate),
    [anchorDate]
  );

  useEffect(() => {
    const fetchMonthEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const timeMin = new Date(firstOfMonth);
        timeMin.setHours(0, 0, 0, 0);
        const timeMax = new Date(lastOfMonth);
        timeMax.setHours(23, 59, 59, 999);
        const data = await calendarAPI.listEvents({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          includeHolidays: true,
          maxResults: 200,
        });
        setEvents(data);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load calendar data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMonthEvents();
  }, [firstOfMonth.getTime(), lastOfMonth.getTime()]);

  const days = useMemo(
    () => buildCalendarDays(anchorDate, events),
    [anchorDate, events]
  );

  const monthLabel = useMemo(
    () => formatMonthHeading(anchorDate),
    [anchorDate]
  );

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
          <p className="text-sm text-slate-500">{formatRangeLabel(events)}</p>
        </div>
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
            Prev
          </button>
          <div className="text-sm font-medium text-slate-700">{monthLabel}</div>
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
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-sm">
        {days.map((day) => {
          const isToday =
            toISODate(day.date) === toISODate(new Date());
          return (
            <div
              key={day.date.toISOString()}
              className={`min-h-[88px] rounded-xl border p-2 transition ${
                day.inCurrentMonth
                  ? "border-slate-200 bg-white"
                  : "border-transparent bg-slate-50 text-slate-400"
              } ${isToday ? "ring-1 ring-blue-500" : ""}`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>{day.date.getDate()}</span>
                {isToday && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                    Today
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {day.events.map((dot, index) => (
                  <span
                    key={`${dot.label}-${index}`}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: dot.color }}
                    title={dot.label}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Syncing calendar…
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}

