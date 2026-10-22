"use client";

import { FolderStatus } from "@/components/carpetas/folder-status";
import { Progress } from "@/components/tailgrids/core/progress";
import { useI18n } from "@/context/i18n-context";
import type { CarpetaSummary } from "@/lib/api";
import Link from "next/link";

export function CourseFolder({ carpeta }: { carpeta: CarpetaSummary }) {
  const { t } = useI18n();
  const { curso, metricas } = carpeta;
  const observed = carpeta.estado_ciclo === "observada";

  return (
    <article className="grid gap-5 border-b border-card-border px-5 py-6 last:border-b-0 sm:px-6 xl:grid-cols-[minmax(0,1fr)_15rem_auto] xl:items-center xl:gap-8">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-medium tabular-nums text-text-tertiary">
            {curso.codigo}
          </span>
          <FolderStatus carpeta={carpeta} />
        </div>
        <h3 className="text-lg font-semibold leading-7 text-text-primary">
          <Link
            href={`/docente/carpeta/${carpeta.id}`}
            className="rounded-sm transition-colors hover:text-brand-500"
          >
            {curso.nombre}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-text-tertiary">
          {t("docente.section")} {carpeta.seccion} · {t("docente.cycle")}{" "}
          {curso.ciclo} · {carpeta.semestre.nombre}
        </p>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
          <span className="text-text-secondary">
            {t("docente.documentsCount", {
              done: metricas.completadas_obligatorias,
              total: metricas.total_obligatorias,
            })}
          </span>
          <span className="font-medium tabular-nums text-text-primary">
            {metricas.porcentaje_avance}%
          </span>
        </div>
        <Progress
          progress={metricas.porcentaje_avance}
          className="max-w-full"
        />
        <p className="mt-2 text-xs leading-5 text-text-tertiary">
          {t("docente.reviewBreakdown", {
            approved: metricas.aprobadas,
            review: metricas.entregadas,
          })}
        </p>
        <p className="text-xs leading-5 text-text-tertiary">
          {metricas.observadas > 0
            ? t("docente.observedCount", { count: metricas.observadas })
            : t("docente.pendingCount", { count: metricas.pendientes })}
        </p>
      </div>
      <Link
        href={`/docente/carpeta/${carpeta.id}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-button-primary-outline-stroke px-4 py-2.5 text-sm font-medium whitespace-nowrap text-text-primary transition-colors duration-150 hover:border-brand-500 hover:bg-brand-100 hover:text-brand-600 xl:min-w-40"
      >
        {observed ? t("docente.btnResolve") : t("docente.btnOpen")}
      </Link>
    </article>
  );
}
