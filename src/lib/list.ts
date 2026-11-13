// What every screen of the list kind does the same way, so it is written once (the page of the list
// kind under design/patterns): load the items, try again after a failure, filter by name, and
// change one item in place without sending the whole list back to loading. Each screen gives only
// where its items come from, as a function of the data source that stays the same while it is
// shown.
import { useEffect, useState } from "react";

export type List<T> = {
  // Null while the list is loading.
  items: T[] | null;
  failed: boolean;
  // Load again after a failure.
  reload: () => void;
  query: string;
  setQuery: (query: string) => void;
  // The items the filter lets through.
  shown: T[];
  // Change the loaded items in place: one row comes, goes or changes, the rest stay.
  change: (update: (items: T[]) => T[]) => void;
};

export function useList<T extends { name: string }>(load: () => Promise<T[]>): List<T> {
  const [items, setItems] = useState<T[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => {
    let current = true; // ignore an answer that arrives after the screen has moved on
    load().then(
      (found) => current && setItems(found),
      () => current && setFailed(true),
    );
    return () => {
      current = false;
    };
  }, [load, attempt]);
  const shown = (items ?? []).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );
  return {
    items,
    failed,
    reload: () => {
      setItems(null);
      setFailed(false);
      setAttempt((n) => n + 1);
    },
    query,
    setQuery,
    shown,
    change: (update) => setItems((current) => (current ? update(current) : current)),
  };
}
