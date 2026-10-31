import { useEffect, useState } from "react";

const isEditing = (element: Element | null): element is HTMLElement =>
  element instanceof HTMLElement &&
  (element.isContentEditable ||
    ((element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement) &&
      !element.readOnly &&
      !element.disabled &&
      ![
        "button",
        "submit",
        "reset",
        "checkbox",
        "radio",
        "file",
        "range",
        "color",
        "hidden",
      ].includes(element.type)));

export const revealFocusedInput = () => {
  const element = document.activeElement;
  if (!isEditing(element)) return;
  const viewport = window.visualViewport;
  const top = (viewport?.offsetTop ?? 0) + 16;
  const bottom =
    (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 16;
  const bounds = element.getBoundingClientRect();
  const delta =
    bounds.bottom > bottom
      ? bounds.bottom - bottom
      : bounds.top < top
        ? bounds.top - top
        : 0;
  if (!delta) return;
  // Dialogs have their own scrollable content; the calculator uses the page.
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (
      /(auto|scroll)/.test(getComputedStyle(parent).overflowY) &&
      parent.scrollHeight > parent.clientHeight
    ) {
      parent.scrollBy({ top: delta, behavior: "auto" });
      return;
    }
    parent = parent.parentElement;
  }
  window.scrollBy({ top: delta, behavior: "auto" });
};

export default function useMobileKeyboard(enabled: boolean) {
  const [keyboard, setKeyboard] = useState({ open: false, bottomInset: 0 });
  useEffect(() => {
    if (!enabled) {
      setKeyboard({ open: false, bottomInset: 0 });
      return;
    }
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let baseline = Math.max(window.innerHeight, viewport?.height ?? 0);
    let frame = 0;
    let focusFrame = 0;
    let settleTimer = 0;
    const measure = () => {
      // Pinch zoom changes the visible viewport too, but is not a keyboard.
      if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
      const editing = isEditing(document.activeElement);
      const height = viewport?.height ?? window.innerHeight;
      if (!editing) baseline = Math.max(window.innerHeight, height);
      else baseline = Math.max(baseline, window.innerHeight);
      const open = editing && baseline - height > 120;
      const bottomInset = open
        ? Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0))
        : 0;
      root.toggleAttribute("data-keyboard-open", open);
      root.style.setProperty("--visual-viewport-height", `${height}px`);
      root.style.setProperty(
        "--visual-viewport-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
      root.style.setProperty("--keyboard-inset", `${bottomInset}px`);
      setKeyboard((previous) =>
        previous.open === open && previous.bottomInset === bottomInset
          ? previous
          : { open, bottomInset },
      );
      if (open) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(revealFocusedInput);
      }
    };
    const focusChanged = () => {
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(measure);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(measure, 350);
    };
    document.addEventListener("focusin", focusChanged);
    document.addEventListener("focusout", focusChanged);
    viewport?.addEventListener("resize", measure);
    viewport?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      document.removeEventListener("focusin", focusChanged);
      document.removeEventListener("focusout", focusChanged);
      viewport?.removeEventListener("resize", measure);
      viewport?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      window.clearTimeout(settleTimer);
      root.removeAttribute("data-keyboard-open");
      [
        "--visual-viewport-height",
        "--visual-viewport-top",
        "--keyboard-inset",
      ].forEach((property) => root.style.removeProperty(property));
    };
  }, [enabled]);
  return keyboard;
}
