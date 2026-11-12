// Which record of a list is open, kept in the address so that a link opens it and Back closes it.
// Read by WithRecord (src/components/record-panel.tsx), which arranges it beside the list.
import { useEffect, useRef, useState } from "react";

// The address key that names the open record.
const PARAM = "record";
const readOpen = () => new URLSearchParams(window.location.search).get(PARAM);

export type OpenRecord = {
  // The open record, as the address names it, or null.
  id: string | null;
  // Opens a record; `from` is the control that opened it, which gets focus back on close.
  open: (id: string, from: HTMLElement | null) => void;
  close: () => void;
  // Whether the record now showing was opened by a person here, once: its heading then takes
  // focus. A record opened from a link takes none.
  takeFocus: () => boolean;
};

export function useOpenRecord(): OpenRecord {
  const [id, setId] = useState<string | null>(readOpen);
  const from = useRef<HTMLElement | null>(null);
  const opened = useRef(false);
  const shown = useRef(id);
  useEffect(() => {
    const follow = () => setId(readOpen());
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, []);
  // After a record closes, however it closed, focus goes back to what opened it.
  useEffect(() => {
    if (shown.current !== null && id === null && from.current?.isConnected) from.current.focus();
    shown.current = id;
  }, [id]);
  return {
    id,
    open(next, control) {
      from.current = control;
      opened.current = true;
      const url = new URL(window.location.href);
      url.searchParams.set(PARAM, next);
      // Opening from a closed list adds a step to Back; moving to another record replaces it.
      if (id === null) window.history.pushState({ [PARAM]: true }, "", url);
      else window.history.replaceState(window.history.state, "", url);
      setId(next);
    },
    close() {
      opened.current = false;
      if ((window.history.state as Record<string, unknown> | null)?.[PARAM]) {
        window.history.back();
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete(PARAM);
      window.history.replaceState(window.history.state, "", url);
      setId(null);
    },
    takeFocus() {
      const take = opened.current;
      opened.current = false;
      return take;
    },
  };
}
