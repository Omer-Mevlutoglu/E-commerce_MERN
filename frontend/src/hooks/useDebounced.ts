import { useEffect, useState } from "react";

/**
 * Returns `value` only once it has stopped changing for `delay` ms.
 *
 * Used by the search box so typing does not fire a request per keystroke, and
 * does not push a history entry per keystroke either.
 */
export const useDebounced = <T,>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
