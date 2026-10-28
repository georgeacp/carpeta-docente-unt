"use client";

import { useRef, useState } from "react";

export function useSubmission() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const run = async (operation: () => Promise<void>) => {
    if (locked.current) return;

    locked.current = true;
    setPending(true);
    setError("");
    setCompleted(false);

    try {
      await operation();
      setCompleted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar. Vuelve a intentarlo.");
    } finally {
      locked.current = false;
      setPending(false);
    }
  };

  return { pending, error, completed, run };
}
