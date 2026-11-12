// Whether something has been going on for long enough that a person should be told
// (design/behaviors.md, waiting): under a second nothing is shown, from a second on it is.
import { useEffect, useState } from "react";

export const SLOW_AFTER_MS = 1000;

export function useSlow(active: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active]);
  return slow;
}
