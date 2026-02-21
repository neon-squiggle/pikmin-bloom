import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { MushroomEvent } from "./types";

const STORAGE_KEY = "pikminBloomMushroomEvents";
dayjs.extend(utc);

export function useMushroomTries() {
  const [events, setEvents] = useState<MushroomEvent[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    return JSON.parse(stored).map((e: any) => {
      const endTime = dayjs.utc(e.endTime).local();
      const startTime = e.startTime ? dayjs.utc(e.startTime).local() : endTime;
      return { ...e, startTime, endTime };
    });
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  function addEvent(event: MushroomEvent) {
    setEvents((prev) =>
      [...prev, event].sort((a, b) => a.endTime.valueOf() - b.endTime.valueOf())
    );
    setSelectedMonth(event.endTime.format("YYYY-MM"));
  }

  function updateEvent(id: string, updated: Partial<MushroomEvent>) {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, ...updated } : e))
        .sort((a, b) => a.endTime.valueOf() - b.endTime.valueOf())
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
        tries: monthEvents.filter((e) => e.endTime.format("YYYY-MM-DD") === date),
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
