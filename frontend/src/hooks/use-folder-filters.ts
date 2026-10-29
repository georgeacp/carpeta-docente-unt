"use client";

import { useSearchParams } from "next/navigation";
import { CarpetaSummary } from "@/lib/api";

export function useFolderFilters(carpetas: CarpetaSummary[]) {
  const params = useSearchParams();
  const get = (key: string) => params.get(key) ?? "";

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());

    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${next.size ? `?${next}` : ""}`,
    );
  };

  const filtered = carpetas.filter(
    (c) =>
      (!get("semestre") || String(c.semestre.id) === get("semestre")) &&
      (!get("curso") || String(c.curso.id) === get("curso")) &&
      (!get("docente") || String(c.docente.id) === get("docente")) &&
      (!get("estado") ||
        c.metricas.estado_global === get("estado") ||
        c.estado_ciclo === get("estado")) &&
      `${c.curso.codigo} ${c.curso.nombre} ${c.docente.nombre} ${c.docente.email}`
        .toLocaleLowerCase()
        .includes(get("q").toLocaleLowerCase()),
  );

  const clear = () => {
    const next = new URLSearchParams(params.toString());

    for (const key of ["semestre", "curso", "docente", "estado", "q"])
      next.delete(key);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${next.size ? `?${next}` : ""}`,
    );
  };

  return { get, set, filtered, clear };
}
