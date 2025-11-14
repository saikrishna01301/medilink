import { Appointment, HolidayEvent } from "@/services/api";

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type CalendarItem = Appointment | HolidayEvent;

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
};

export const getMonthGridBounds = (anchor: Date, weekStartsOn: Weekday = 0) => {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

  const gridStart = new Date(firstOfMonth);
  const startOffset = (gridStart.getDay() - weekStartsOn + 7) % 7;
  gridStart.setDate(gridStart.getDate() - startOffset);

  const gridEnd = new Date(lastOfMonth);
  const endOffset = (weekStartsOn + 6 - gridEnd.getDay() + 7) % 7;
  gridEnd.setDate(gridEnd.getDate() + endOffset);

  return { firstOfMonth, lastOfMonth, gridStart, gridEnd };
};

export const getEventDate = (
  event: CalendarItem,
  field: "start" | "end" = "start"
): Date | null => {
  if ("start_time" in event) {
    const raw = field === "start" ? event.start_time : event.end_time;
    if (!raw) return null;
    return new Date(raw);
  }

  const node = event[field];
  if (!node) return null;

  const raw = node.dateTime ?? node.date;
  if (!raw) return null;

  if (raw.includes("T")) return new Date(raw);
  return parseDateKey(raw);
};

export const getEventDateKey = (
  event: CalendarItem,
  field: "start" | "end" = "start"
): string | null => {
  const date = getEventDate(event, field);
  return date ? formatDateKey(date) : null;
};

export const atStartOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const atEndOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

