import { useCallback, useState } from 'react';

/**
 * Typed localStorage-backed state. Falls back silently to in-memory
 * state if storage is unavailable (e.g. private browsing restrictions).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage unavailable — keep the in-memory value only.
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
