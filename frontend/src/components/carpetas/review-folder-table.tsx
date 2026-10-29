"use client";

import Link from "next/link";
import { useI18n } from "@/context/i18n-context";
import { CarpetaSummary } from "@/lib/api";
import { FolderStatus } from "./folder-status";
import { Progress } from "@/components/tailgrids/core/progress";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";

export function ReviewFolderTable({
  carpetas,
}: {
  carpetas: CarpetaSummary[];
}) {
  const { t } = useI18n();

  return (
    <TableRoot className="min-w-220">
      <TableHeader>
        <TableRow>
          <TableHead>{t("revisor.colCourse")}</TableHead>
          <TableHead>{t("revisor.colTeacher")}</TableHead>
          <TableHead>{t("revisor.colProgress")}</TableHead>
          <TableHead>{t("revisor.colStatus")}</TableHead>
          <TableHead className="text-right">
            {t("revisor.colActions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {carpetas.map((c) => (
          <TableRow
            key={c.id}
            className="transition-colors hover:bg-background-gray-primary"
          >
            <TableCell className="max-w-80 whitespace-normal py-5">
              <p className="font-medium leading-6 text-text-primary">
                {c.curso.nombre}
              </p>
              <p className="mt-1 text-xs leading-5 text-text-tertiary">
                {c.curso.codigo} · {t("docente.section")} {c.seccion} ·{" "}
                {c.semestre.nombre}
              </p>
            </TableCell>
            <TableCell className="max-w-60 whitespace-normal">
              <p className="font-medium text-text-primary">
                {c.docente.nombre}
              </p>
              <p className="mt-1 break-all text-xs text-text-tertiary">
                {c.docente.email}
              </p>
            </TableCell>
            <TableCell className="min-w-44">
              <div className="mb-2 flex items-center justify-between gap-4 text-xs tabular-nums text-text-secondary">
                <span>
                  {c.metricas.completadas_obligatorias}/
                  {c.metricas.total_obligatorias}
                </span>
                <span className="font-medium text-text-primary">
                  {c.metricas.porcentaje_avance}%
                </span>
              </div>
              <p className="mb-2 text-xs text-text-secondary">
                {t("modules.approval")}: {c.metricas.porcentaje_aprobacion}%
              </p>
              <Progress
                progress={c.metricas.porcentaje_avance}
                className="max-w-full"
              />
              <p className="mt-2 text-xs leading-5 text-text-tertiary">
                {t("docente.reviewBreakdown", {
                  approved: c.metricas.aprobadas,
                  review: c.metricas.entregadas,
                })}
              </p>
              {c.metricas.observadas > 0 && (
                <p className="text-xs leading-5 text-badge-warning-text">
                  {t("docente.observedCount", {
                    count: c.metricas.observadas,
                  })}
                </p>
              )}
            </TableCell>
            <TableCell>
              <FolderStatus carpeta={c} />
              <p className="mt-2 text-xs text-text-secondary">
                {t("modules.overdue")}:{" "}
                {c.seguimiento?.hitos_vencidos_sin_presentacion ?? 0}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {t("modules.late")}: {c.seguimiento?.entregas_tardias ?? 0}
              </p>
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/revisor/carpeta/${c.id}`}
                className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-brand-600 transition-colors hover:bg-brand-100"
              >
                {t("revisor.btnInspect")}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  );
}
