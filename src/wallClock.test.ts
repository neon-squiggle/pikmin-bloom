import { preserveClockOccurrence } from "./wallClock";

it.each([
  ["America/Los_Angeles", "2026-11-01T09:30Z", "2026-11-01T08:45Z", "2026-11-01T09:45Z"],
  ["Europe/Berlin", "2026-10-25T01:30Z", "2026-10-25T00:45Z", "2026-10-25T01:45Z"],
  ["Australia/Lord_Howe", "2026-04-04T15:15Z", "2026-04-04T14:50Z", "2026-04-04T15:20Z"],
  ["America/Los_Angeles", "2026-11-01T09:30Z", "2026-11-01T10:00Z", "2026-11-01T10:00Z"],
])("preserves the selected occurrence during edits in %s", (zone, previous, next, expected) => {
  expect(preserveClockOccurrence(Date.parse(next), Date.parse(previous), zone)).toBe(Date.parse(expected));
});
