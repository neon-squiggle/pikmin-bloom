import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { MushroomEvent } from "./types";

const STORAGE_KEY = "pikminBloomMushroomEvents";
dayjs.extend(utc);

const isStoredEvent = (
  value: unknown,
): value is Omit<MushroomEvent, "startTime" | "endTime"> & {
  startTime?: string;
  endTime: string;
} => {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === "string" &&
    typeof event.endTime === "string" &&
    typeof event.mush === "object" &&
    event.mush !== null &&
    typeof event.health === "number" &&
    Number.isFinite(event.health) &&
    typeof event.pikminAp === "number" &&
    Number.isFinite(event.pikminAp) &&
    (event.startTime == null || typeof event.startTime === "string")
  );
};

export const deserializeEvents = (stored: string | null): MushroomEvent[] => {
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((event) => {
      if (!isStoredEvent(event)) return [];

      const endTime = dayjs.utc(event.endTime).local();
      const startTime = event.startTime
        ? dayjs.utc(event.startTime).local()
        : endTime;
      if (!startTime.isValid() || !endTime.isValid()) return [];

      return [{ ...event, startTime, endTime }];
    });
  } catch {
    return [];
  }
};

export function useMushroomTries() {
  const [events, setEvents] = useState<MushroomEvent[]>(() => {
    try {
      return deserializeEvents(localStorage.getItem(STORAGE_KEY));
    } catch {
      return [];
    }
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // The app remains usable when storage is unavailable or full.
    }
  }, [events]);

  function addEvent(event: MushroomEvent) {
    setEvents((prev) =>
      [...prev, event].sort(
        (a, b) => a.endTime.valueOf() - b.endTime.valueOf(),
      ),
    );
    setSelectedMonth(event.endTime.format("YYYY-MM"));
  }

  function updateEvent(id: string, updated: Partial<MushroomEvent>) {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, ...updated } : e))
        .sort((a, b) => a.endTime.valueOf() - b.endTime.valueOf()),
    );
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const monthsWithEvents = useMemo(() => {
    const counts = events.reduce((acc, e) => {
      const month = e.endTime.format("YYYY-MM");
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([month, count]) => ({
        key: month,
        label: `${dayjs(month, "YYYY-MM").format("MMMM YYYY")} (${count})`,
      }))
      .sort((a, b) => (a.key > b.key ? 1 : -1));
  }, [events]);

  useEffect(() => {
    if (selectedMonth !== "") return;
    if (monthsWithEvents.length === 0) return;

    setSelectedMonth(monthsWithEvents[0].key);
  }, [monthsWithEvents, selectedMonth]);

  const days = useMemo(() => {
    if (!selectedMonth) return [];

    const daysInMonth = dayjs(selectedMonth).daysInMonth();
    const monthEvents = events.filter(
      (e) => e.endTime.format("YYYY-MM") === selectedMonth
    );

    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = dayjs(`${selectedMonth}-${i + 1}`).format("YYYY-MM-DD");
      return {
        date,
      tries: monthEvents.filter(
        (e) => e.endTime.format("YYYY-MM-DD") === date,
      ),
      };
    });
  }, [events, selectedMonth]);

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    days,
    monthsWithEvents,
    selectedMonth,
    setSelectedMonth,
  };
}
