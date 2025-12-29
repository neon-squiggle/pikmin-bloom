import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { MushroomTry } from "./types";

const STORAGE_KEY = "pikminBloomMushroomEvents";
dayjs.extend(utc);

export function useMushroomTries() {
  const [events, setEvents] = useState<MushroomTry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    return JSON.parse(stored).map((e: any) => ({
      ...e,
      startTime: e.startTime ? dayjs(e.startTime) : undefined,
      endTime: dayjs.utc(e.endTime).local(),
    }));
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  function addEvent(event: MushroomTry) {
    setEvents((prev) => {
      const next = [...prev, event].sort(
        (a, b) => a.endTime.valueOf() - b.endTime.valueOf()
      );

      const newMonth = event.endTime.format("YYYY-MM");
      setSelectedMonth(newMonth);

      return next;
    });
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
    const daysInMonth = dayjs(selectedMonth).daysInMonth();

    const map = new Map<string, MushroomTry[]>();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = dayjs(`${selectedMonth}-${d}`).format("YYYY-MM-DD");
      map.set(date, []);
    }

    events.forEach((e) => {
      if (e.endTime.format("YYYY-MM") !== selectedMonth) return;

      const day = e.endTime.format("YYYY-MM-DD");
      map.get(day)?.push(e);
    });

    return Array.from(map.entries()).map(([date, tries]) => ({
      date,
      tries,
    }));
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
