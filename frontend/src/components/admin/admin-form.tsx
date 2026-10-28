"use client";

import { FormEventHandler, ReactNode } from "react";

interface AdminFormProps {
  id: string;
  className?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  state: { pending: boolean; error: string; completed: boolean };
  children: ReactNode;
}

export function AdminForm({ id, className, onSubmit, state, children }: AdminFormProps) {
  return (
    <form id={id} className={className} onSubmit={onSubmit} aria-busy={state.pending} aria-describedby={`${id}-feedback`}>
      <fieldset disabled={state.pending} className="min-w-0 space-y-4">
        <legend className="sr-only">{id === "asignacion" ? "Asignar carga lectiva" : id === "curso" ? "Registrar curso" : id === "usuario" ? "Registrar usuario" : "Crear semestre"}</legend>
        {children}
      </fieldset>
      <div id={`${id}-feedback`} className="mt-3 text-sm text-text-secondary" aria-live="polite">
        {state.error ? <p role="alert" className="text-badge-warning-text">{state.error}</p> : state.pending ? "Guardando…" : state.completed ? "Operación completada." : null}
      </div>
    </form>
  );
}
