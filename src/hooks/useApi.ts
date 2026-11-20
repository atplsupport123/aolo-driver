import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../api/client';

/**
 * Wraps a mutation: tracks loading, maps Laravel 422 field errors, and shows
 * a plain alert for anything else.
 */
export function useAction<A extends any[], R>(fn: (...args: A) => Promise<R>) {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const run = useCallback(
    async (...args: A): Promise<R> => {
      setLoading(true);
      setFieldErrors({});
      try {
        return await fn(...args);
      } catch (e) {
        if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
          setFieldErrors(e.fieldErrors);
        } else {
          Alert.alert('Could not complete', e instanceof Error ? e.message : 'Please try again.');
        }
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  /** Same as run but swallows the rethrow, for fire-and-forget buttons. */
  const fire = useCallback(
    (...args: A) => {
      run(...args).catch(() => {});
    },
    [run],
  );

  return { run, fire, loading, fieldErrors, setFieldErrors };
}
