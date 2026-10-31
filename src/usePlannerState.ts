import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  emptyPlanner,
  loadPlanner,
  parsePlannerState,
  PlannerState,
  PLANNER_STORAGE_KEY,
} from "./stagePlanner";
import {
  mergePlannerChanges,
  plannerSignature,
  serializePlanner,
} from "./plannerPersistence";

const usePlannerState = (browserZone: string) => {
  const [state, setState] = useState(() => loadPlanner(browserZone));
  const current = useRef(state);
  const saved = useRef(state);
  const pending = useRef(false);
  const [storageError, setStorageError] = useState(false);
  const persist = useCallback(
    (next: PlannerState) => {
      try {
        const value = serializePlanner(next);
        const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
        let stored: PlannerState | null = null;
        try {
          stored = raw ? parsePlannerState(JSON.parse(raw), browserZone) : null;
        } catch {
          /* Replace invalid saved data with the valid open plan. */
        }
        if (!stored || plannerSignature(stored) !== plannerSignature(next))
          localStorage.setItem(PLANNER_STORAGE_KEY, value);
        saved.current = next;
        pending.current = false;
        setStorageError(false);
      } catch {
        pending.current = true;
        setStorageError(true);
      }
    },
    [browserZone],
  );
  const update: Dispatch<SetStateAction<PlannerState>> = useCallback(
    (action) => {
      const before = current.current;
      const proposed = typeof action === "function" ? action(before) : action;
      let remote = before;
      try {
        const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
        remote = raw
          ? (parsePlannerState(JSON.parse(raw), browserZone) ?? before)
          : before;
      } catch {
        /* Keep unsaved edits available in memory when storage is unavailable. */
      }
      const next = mergePlannerChanges(
        pending.current ? saved.current : before,
        proposed,
        remote,
      );
      current.current = next;
      setState(next);
      persist(next);
    },
    [browserZone, persist],
  );
  useEffect(() => {
    persist(current.current);
    const receive = (event: StorageEvent) => {
      if (
        event.key !== PLANNER_STORAGE_KEY ||
        (event.storageArea && event.storageArea !== localStorage)
      )
        return;
      try {
        const before = event.oldValue
          ? parsePlannerState(JSON.parse(event.oldValue), browserZone)
          : emptyPlanner(browserZone);
        const incoming = event.newValue
          ? parsePlannerState(JSON.parse(event.newValue), browserZone)
          : emptyPlanner(browserZone);
        if (!before || !incoming) return;
        const next = mergePlannerChanges(before, incoming, current.current);
        current.current = next;
        setState(next);
        persist(next);
      } catch {
        /* Ignore malformed events without discarding the open plan. */
      }
    };
    window.addEventListener("storage", receive);
    return () => window.removeEventListener("storage", receive);
  }, [browserZone, persist]);
  const retry = useCallback(() => update(before => before), [update]);
  return [state, update, storageError, current, retry] as const;
};
export default usePlannerState;
