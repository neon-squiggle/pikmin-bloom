import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { MushroomTry } from "./types";

const STORAGE_KEY = "pikminBloomMushroomEvents";

export function useMushroomTries() {
  const [events, setEvents] = useState<MushroomTry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    return JSON.parse(stored).map((e: any) => ({
      ...e,
      startTime: e.startTime ? dayjs(e.startTime) : undefined,
      endTime: dayjs(e.endTime),
    }));
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  function addEvent(event: MushroomTry) {
    setEvents((prev) =>
      [...prev, event].sort((a, b) => a.endTime.valueOf() - b.endTime.valueOf())
    );
  }
  function updateEvent(id: string, updated: Partial<MushroomTry>) {
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

  const days: { date: string; tries: MushroomTry[] }[] = useMemo(() => {
    const filtered = events.filter(
      (e) => e.endTime.format("YYYY-MM") === selectedMonth
    );
    const map = new Map<string, MushroomTry[]>();
    filtered.forEach((e) => {
      const day = dayjs(e.endTime).format("YYYY-MM-DD");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    });
    return Array.from(map.entries())
      .map(([date, tries]) => ({ date, tries }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
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
