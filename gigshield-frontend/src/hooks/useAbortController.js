import { useEffect, useRef } from 'react';

/**
 * Returns a ref to an AbortController that is automatically aborted on unmount.
 * Usage:
 *   const abortRef = useAbortController();
 *   fetch(url, { signal: abortRef.current.signal });
 */
export function useAbortController() {
  const controllerRef = useRef(new AbortController());

  useEffect(() => {
    // Create fresh controller on mount
    controllerRef.current = new AbortController();
    return () => {
      // Abort on unmount
      controllerRef.current.abort();
    };
  }, []);

  return controllerRef;
}

export default useAbortController;
