"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useRemoteData<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setValue] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    const current = ++sequence.current;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);

    try {
      const value = await load(request.signal);

      if (current !== sequence.current || request.signal.aborted) return;

      setValue(value);
      setError(null);
    } catch (cause) {
      if (current !== sequence.current || request.signal.aborted) return;

      setError(cause instanceof Error ? cause : new Error("No se pudo cargar la información."));
    } finally {
      if (current === sequence.current && !request.signal.aborted) setLoading(false);
    }
  }, [load]);

  const cancel = useCallback(() => {
    ++sequence.current;
    controller.current?.abort();
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void reload(); });

    return () => { active = false; cancel(); };
  }, [reload, cancel]);

  const setData = useCallback((value: T) => {
    ++sequence.current;
    controller.current?.abort();
    setValue(value);
    setError(null);
    setLoading(false);
  }, []);

  return { data, setData, error, loading, reload };
}
