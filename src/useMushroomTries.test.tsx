import { renderHook, act } from "@testing-library/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useMushroomTries } from "./useMushroomTries";
import { mushrooms } from "./types";

dayjs.extend(utc);

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

let eventCounter = 0;
const createEvent = (overrides = {}) => ({
  id: `test-event-${++eventCounter}`,
  name: "Test Event",
  mush: mushrooms[0],
  health: 1000,
  pikminAp: 100,
  startTime: dayjs("2024-01-01T10:00:00"),
  endTime: dayjs("2024-01-01T12:00:00"),
  ...overrides,
});

describe("useMushroomTries", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    eventCounter = 0;
  });

  describe("initialization", () => {
    it("initializes with empty events when localStorage is empty", () => {
      const { result } = renderHook(() => useMushroomTries());
      expect(result.current.events).toEqual([]);
    });

    it("loads events from localStorage and parses dates", () => {
      // Simulate what's actually stored - dates as ISO strings
      const storedEvent = {
        id: "stored-1",
        name: "Stored Event",
        mush: mushrooms[0],
        health: 1000,
        pikminAp: 100,
        startTime: "2024-01-01T10:00:00.000Z",
        endTime: "2024-01-01T12:00:00.000Z",
      };
      mockLocalStorage.setItem(
        "pikminBloomMushroomEvents",
        JSON.stringify([storedEvent])
      );

      const { result } = renderHook(() => useMushroomTries());
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].name).toBe("Stored Event");
      // Verify dates are parsed as dayjs objects
      expect(result.current.events[0].endTime.format).toBeDefined();
      expect(result.current.events[0].startTime.format).toBeDefined();
    });
  });

  describe("addEvent", () => {
    it("adds an event to the list", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent();

      act(() => {
        result.current.addEvent(event);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].id).toBe(event.id);
    });

    it("sorts events by endTime", () => {
      const { result } = renderHook(() => useMushroomTries());
      const laterEvent = createEvent({ id: "later", endTime: dayjs("2024-01-02T12:00:00") });
      const earlierEvent = createEvent({ id: "earlier", endTime: dayjs("2024-01-01T12:00:00") });

      act(() => {
        // Add later event first
        result.current.addEvent(laterEvent);
      });
      act(() => {
        // Then add earlier event
        result.current.addEvent(earlierEvent);
      });

      // Earlier event should be sorted to index 0
      expect(result.current.events[0].id).toBe("earlier");
      expect(result.current.events[1].id).toBe("later");
    });

    it("sets selectedMonth to the event's month", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent({ endTime: dayjs("2024-03-15T12:00:00") });

      act(() => {
        result.current.addEvent(event);
      });

      expect(result.current.selectedMonth).toBe("2024-03");
    });
  });

  describe("updateEvent", () => {
    it("updates an existing event", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent();

      act(() => {
        result.current.addEvent(event);
      });

      act(() => {
        result.current.updateEvent(event.id, { name: "Updated Name" });
      });

      expect(result.current.events[0].name).toBe("Updated Name");
    });

    it("preserves other fields when updating", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent({ name: "Original", pikminAp: 100 });

      act(() => {
        result.current.addEvent(event);
      });

      act(() => {
        result.current.updateEvent(event.id, { name: "Updated" });
      });

      expect(result.current.events[0].name).toBe("Updated");
      expect(result.current.events[0].pikminAp).toBe(100); // Unchanged
    });

    it("maintains sort order after update changes endTime", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event1 = createEvent({ id: "event1", endTime: dayjs("2024-01-01T12:00:00") });
      const event2 = createEvent({ id: "event2", endTime: dayjs("2024-01-02T12:00:00") });

      act(() => {
        result.current.addEvent(event1);
      });
      act(() => {
        result.current.addEvent(event2);
      });

      // Verify initial order
      expect(result.current.events[0].id).toBe("event1");
      expect(result.current.events[1].id).toBe("event2");

      act(() => {
        // Move event1 to after event2
        result.current.updateEvent(event1.id, { endTime: dayjs("2024-01-03T12:00:00") });
      });

      expect(result.current.events[0].id).toBe("event2");
      expect(result.current.events[1].id).toBe("event1");
    });

    it("does nothing when updating non-existent event", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent();

      act(() => {
        result.current.addEvent(event);
      });

      act(() => {
        result.current.updateEvent("non-existent-id", { name: "Should not appear" });
      });

      expect(result.current.events[0].name).toBe("Test Event");
    });
  });

  describe("deleteEvent", () => {
    it("removes an event from the list", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent();

      act(() => {
        result.current.addEvent(event);
      });

      act(() => {
        result.current.deleteEvent(event.id);
      });

      expect(result.current.events).toHaveLength(0);
    });

    it("does nothing when deleting non-existent event", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent();

      act(() => {
        result.current.addEvent(event);
      });

      act(() => {
        result.current.deleteEvent("non-existent-id");
      });

      expect(result.current.events).toHaveLength(1);
    });
  });

  describe("monthsWithEvents", () => {
    it("returns months that have events with counts", () => {
      const { result } = renderHook(() => useMushroomTries());
      const jan1 = createEvent({ endTime: dayjs("2024-01-15T12:00:00") });
      const jan2 = createEvent({ endTime: dayjs("2024-01-20T12:00:00") });
      const feb1 = createEvent({ endTime: dayjs("2024-02-15T12:00:00") });

      act(() => {
        result.current.addEvent(jan1);
        result.current.addEvent(jan2);
        result.current.addEvent(feb1);
      });

      expect(result.current.monthsWithEvents).toHaveLength(2);
      expect(result.current.monthsWithEvents[0].key).toBe("2024-01");
      expect(result.current.monthsWithEvents[0].label).toContain("(2)");
      expect(result.current.monthsWithEvents[1].key).toBe("2024-02");
      expect(result.current.monthsWithEvents[1].label).toContain("(1)");
    });
  });

  describe("days", () => {
    it("returns days in the selected month with their events", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent({ id: "jan15-event", endTime: dayjs("2024-01-15T12:00:00") });

      act(() => {
        result.current.addEvent(event);
      });

      // selectedMonth should be set to 2024-01
      expect(result.current.days.length).toBe(31); // January has 31 days

      const day15 = result.current.days.find(d => d.date === "2024-01-15");
      expect(day15?.tries).toHaveLength(1);
      expect(day15?.tries[0].id).toBe("jan15-event");
    });

    it("returns empty array when no month is selected", () => {
      const { result } = renderHook(() => useMushroomTries());
      // No events added, so no month selected
      expect(result.current.days).toEqual([]);
    });

    it("only includes events from the selected month", () => {
      const { result } = renderHook(() => useMushroomTries());
      const janEvent = createEvent({ id: "jan-event", endTime: dayjs("2024-01-15T12:00:00") });
      const febEvent = createEvent({ id: "feb-event", endTime: dayjs("2024-02-15T12:00:00") });

      act(() => {
        result.current.addEvent(janEvent);
      });
      act(() => {
        result.current.addEvent(febEvent);
      });

      // selectedMonth is now 2024-02 (last added event)
      expect(result.current.selectedMonth).toBe("2024-02");

      // Only feb event should be in days
      const allTries = result.current.days.flatMap(d => d.tries);
      expect(allTries).toHaveLength(1);
      expect(allTries[0].id).toBe("feb-event");
    });

    it("groups multiple events on the same day", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event1 = createEvent({ id: "morning", endTime: dayjs("2024-01-15T09:00:00") });
      const event2 = createEvent({ id: "afternoon", endTime: dayjs("2024-01-15T15:00:00") });

      act(() => {
        result.current.addEvent(event1);
      });
      act(() => {
        result.current.addEvent(event2);
      });

      const day15 = result.current.days.find(d => d.date === "2024-01-15");
      expect(day15?.tries).toHaveLength(2);
    });
  });

  describe("setSelectedMonth", () => {
    it("changes the selected month", () => {
      const { result } = renderHook(() => useMushroomTries());
      const janEvent = createEvent({ endTime: dayjs("2024-01-15T12:00:00") });
      const febEvent = createEvent({ endTime: dayjs("2024-02-15T12:00:00") });

      act(() => {
        result.current.addEvent(janEvent);
      });
      act(() => {
        result.current.addEvent(febEvent);
      });

      // Currently on Feb
      expect(result.current.selectedMonth).toBe("2024-02");

      act(() => {
        result.current.setSelectedMonth("2024-01");
      });

      expect(result.current.selectedMonth).toBe("2024-01");
      // Days should now show January
      expect(result.current.days.length).toBe(31);
    });
  });

  describe("localStorage persistence", () => {
    it("saves events to localStorage when they change", () => {
      const { result } = renderHook(() => useMushroomTries());
      const event = createEvent();

      act(() => {
        result.current.addEvent(event);
      });

      const stored = JSON.parse(mockLocalStorage.getItem("pikminBloomMushroomEvents")!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(event.id);
    });
  });
});
