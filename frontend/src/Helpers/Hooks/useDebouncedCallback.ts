import { useCallback, useEffect, useRef } from 'react';

interface DebouncedFunction<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

interface Options {
  leading?: boolean;
  trailing?: boolean;
}

function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number,
  options?: Options
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = options ?? {};

  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const leadingCalledRef = useRef(false);

  callbackRef.current = callback;

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
    leadingCalledRef.current = false;
  }, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current);

      if (leading && !leadingCalledRef.current) {
        leadingCalledRef.current = true;
        callbackRef.current(...args);
      }

      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          leadingCalledRef.current = false;
          callbackRef.current(...args);
        }, delay);
      } else {
        timeoutRef.current = setTimeout(() => {
          leadingCalledRef.current = false;
        }, delay);
      }
    },
    [delay, leading, trailing]
  ) as DebouncedFunction<T>;

  debounced.cancel = cancel;

  return debounced;
}

export default useDebouncedCallback;
