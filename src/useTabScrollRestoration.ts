import { RefObject, useLayoutEffect, useRef } from "react";

// Capture before changing the layout; restore after it has rendered. Page and
// card offsets are kept separately so resizing never reuses incompatible pixels.
const useTabScrollRestoration = <Tab extends string>({
  value, onChange, active = true, pageScroll = true, containerRef,
  scope = "", initialPosition,
}: {
  value: Tab;
  onChange: (value: Tab) => void;
  active?: boolean;
  pageScroll?: boolean;
  containerRef?: RefObject<HTMLElement>;
  scope?: string;
  initialPosition?: () => number;
}) => {
  const positions = useRef(new Map<string, number>());
  const visited = useRef(new Set<string>());
  const pending = useRef<string | null>(null);
  const key = `${pageScroll ? "page" : "card"}:${scope}:${value}`;
  const initialize = useRef(initialPosition);
  initialize.current = initialPosition;

  useLayoutEffect(() => {
    if (!active || (!pageScroll && !containerRef?.current)) return;
    const firstVisit = !visited.current.has(key);
    if (pending.current !== key && !firstVisit) return;
    visited.current.add(key);
    const top = positions.current.get(key) ?? initialize.current?.();
    if (top != null || pending.current === key) {
      const target = pageScroll ? window : containerRef!.current!;
      target.scrollTo?.({ top: top ?? 0, behavior: "auto" });
    }
    pending.current = null;
  }, [active, key, pageScroll, containerRef]);

  return (next: Tab, reset = false) => {
    if (active) {
      const target = pageScroll ? window : containerRef?.current;
      if (target) {
        positions.current.set(key, pageScroll ? window.scrollY : containerRef!.current!.scrollTop);
        if (reset) {
          positions.current.set(`${pageScroll ? "page" : "card"}:${scope}:${next}`, 0);
          if (next === value) target.scrollTo?.({ top: 0, behavior: "auto" });
        }
        if (next !== value)
          pending.current = `${pageScroll ? "page" : "card"}:${scope}:${next}`;
      }
    }
    onChange(next);
  };
};

export default useTabScrollRestoration;
