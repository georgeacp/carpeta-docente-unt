"use client";

import Link from "@/components/common/guarded-link";
import { Button } from "@/components/tailgrids/core/button";
import { useAuth } from "@/context/auth-context";
import { ApiError, apiProblem } from "@/lib/api-error";

interface RequestErrorProps { error: Error; onRetry: () => void; backHref?: string; stale?: boolean; pending?: boolean }

export function RequestError({ error, onRetry, backHref, stale = false, pending = false }: RequestErrorProps) {
  const { logout } = useAuth();
  const problem = apiProblem(error);

  return <div role="alert" className="space-y-3 rounded-xl border border-card-border bg-card-background p-5 text-text-primary">
    <p className="font-semibold">{problem.title}</p>
    <p className="text-sm text-text-secondary">{problem.message}</p>
    {stale && <p className="text-sm text-text-secondary">Se muestran los últimos datos disponibles; no se pudieron actualizar.</p>}
    <div className="flex flex-wrap items-center gap-4">
      {problem.retry && <Button className="min-h-11" appearance="outline" isDisabled={pending} onPress={onRetry}>{pending ? "Consultando…" : "Volver a intentar"}</Button>}
      {error instanceof ApiError && error.status === 401 && <Button className="min-h-11" onPress={logout}>Volver a iniciar sesión</Button>}
      {backHref && <Link href={backHref} className="rounded text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-brand-500">Volver al tablero</Link>}
    </div>
  </div>;
}
