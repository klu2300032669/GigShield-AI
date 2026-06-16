import { useState, useEffect } from 'react';

/**
 * Debounce a value by a given delay (default 300ms).
 * Usage: const debouncedQuery = useDebounce(query, 300);
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
