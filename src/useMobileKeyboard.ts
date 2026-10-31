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

// Only reserve space and hide fixed controls. The browser owns focus scrolling.
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
    let wasOpen = false;
    const measure = () => {
      // Pinch zoom changes the visible viewport too, but is not a keyboard.
      if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
      const editing = isEditing(document.activeElement);
      const height = viewport?.height ?? window.innerHeight;
      if (!editing && !wasOpen) baseline = Math.max(window.innerHeight, height);
      else baseline = Math.max(baseline, window.innerHeight);
      // A transient blur must not toggle page padding/navigation while the
      // keyboard is still visible. Its dismissal is a viewport resize.
      const open = (editing || wasOpen) && baseline - height > 120;
      wasOpen = open;
      const bottomInset = open
        ? Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0))
        : 0;
      root.toggleAttribute("data-keyboard-open", open);
      setKeyboard((previous) =>
        previous.open === open && previous.bottomInset === bottomInset
          ? previous
          : { open, bottomInset },
      );
    };
    viewport?.addEventListener("resize", measure);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      viewport?.removeEventListener("resize", measure);
      window.removeEventListener("resize", measure);
      root.removeAttribute("data-keyboard-open");
    };
  }, [enabled]);
  return keyboard;
}
