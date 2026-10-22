"use client";

import { SearchIcon } from "@/components/common/header/icons";
import { FolderListState } from "@/components/carpetas/folder-list-state";
import { FolderStatus } from "@/components/carpetas/folder-status";
import { SummaryStrip } from "@/components/carpetas/summary-strip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/tailgrids/core/input-group";
import { Progress } from "@/components/tailgrids/core/progress";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import {
  apiFetchCarpetasRevisor,
  CarpetaSummary,
  ResumenRevisor,
} from "@/lib/api";
import { useI18n } from "@/context/i18n-context";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RevisorDashboardPage() {
  const { t } = useI18n();
  const [resumen, setResumen] = useState<ResumenRevisor | null>(null);
  const [carpetas, setCarpetas] = useState<CarpetaSummary[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    apiFetchCarpetasRevisor(filtroEstado)
      .then((data) => {
        if (active) {
          setResumen(data.resumen);
          setCarpetas(data.carpetas);
        }
      })
      .catch((err) => {
        if (active) {
          setError(true);
          toast.error(
            err instanceof Error
              ? err.message
              : "Error al cargar panel de revisor",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filtroEstado, retry]);

  const changeFilter = (key: string) => {
    if (key === filtroEstado) return;
    setLoading(true);
    setError(false);
    setFiltroEstado(key);
  };

  const carpetasFiltradas = carpetas.filter((c) => {
    const q = busqueda.trim().toLowerCase();

    return (
      !q ||
      c.docente.nombre.toLowerCase().includes(q) ||
      c.curso.nombre.toLowerCase().includes(q) ||
      c.curso.codigo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
            {t("revisor.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            {t("revisor.desc")}
          </p>
        </div>
        <Link
          href="/docente"
          className="rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background-gray-primary hover:text-text-primary"
        >
          {t("revisor.ownFolders")}
        </Link>
      </div>

      <SummaryStrip
        loading={loading}
        items={[
          {
            label: t("revisor.kpiTotal"),
            value: error ? "—" : (resumen?.total_carpetas ?? 0),
            hint: t("revisor.average", {
              count: resumen?.promedio_avance ?? 0,
            }),
          },
          {
            label: t("revisor.kpiApproved"),
            value: error ? "—" : (resumen?.aprobadas ?? 0),
            hint: t("revisor.approvedHint"),
          },
          {
            label: t("revisor.kpiObs"),
            value: error ? "—" : (resumen?.observadas ?? 0),
            hint: t("revisor.observedHint"),
            attention: !!resumen?.observadas,
          },
          {
            label: t("revisor.kpiInReview"),
            value: error
              ? "—"
              : (resumen?.en_progreso ?? 0) +
                (resumen?.completas_en_revision ?? 0),
            hint: t("revisor.lateHint", { count: resumen?.vencidas ?? 0 }),
          },
        ]}
      />

      <section aria-labelledby="review-list-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="review-list-title"
            className="text-base font-semibold text-text-primary"
          >
            {t("revisor.listTitle")}
          </h2>
          <div className="w-full sm:w-72">
            <InputGroup>
              <InputGroupAddon
                align="inline-start"
                className="text-icon-tertiary"
              >
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t("revisor.searchPlaceholder")}
                placeholder={t("revisor.searchPlaceholder")}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="min-h-11 text-base sm:text-sm"
              />
            </InputGroup>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label={t("revisor.colStatus")}
            className="flex flex-wrap gap-1"
          >
            {[
              { key: "todos", label: t("revisor.filterAll") },
              { key: "observada", label: t("revisor.filterObserved") },
              { key: "en_progreso", label: t("revisor.filterInReview") },
              { key: "aprobada", label: t("revisor.filterApproved") },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={filtroEstado === tab.key}
                onClick={() => changeFilter(tab.key)}
                className={cn(
                  "min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                  filtroEstado === tab.key
                    ? "bg-brand-100 text-brand-600"
                    : "text-text-secondary hover:bg-background-gray-secondary hover:text-text-primary",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p role="status" className="text-xs tabular-nums text-text-tertiary">
            {!loading &&
              !error &&
              t("revisor.results", { count: carpetasFiltradas.length })}
          </p>
        </div>
        <div
          aria-busy={loading}
          className="min-w-0 overflow-hidden rounded-xl border border-card-border bg-card-background"
        >
          {loading ? (
            <div role="status" className="space-y-5 p-6">
              <span className="sr-only">{t("common.loading")}</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="h-16 rounded-lg bg-background-gray-primary motion-safe:animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <FolderListState
              title={t("folders.errorTitle")}
              description={t("folders.errorHint")}
              retryLabel={t("common.retry")}
              onRetry={() => {
                setLoading(true);
                setError(false);
                setRetry((value) => value + 1);
              }}
            />
          ) : carpetasFiltradas.length === 0 ? (
            <FolderListState
              title={t("revisor.emptyTitle")}
              description={t("revisor.emptyHint")}
              retryLabel={t("revisor.clear")}
              onRetry={() => {
                setBusqueda("");
                changeFilter("todos");
              }}
            />
          ) : (
            <TableRoot className="min-w-240">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("revisor.colCourse")}</TableHead>
                  <TableHead>{t("revisor.colTeacher")}</TableHead>
                  <TableHead>{t("revisor.colProgress")}</TableHead>
                  <TableHead>{t("revisor.colStatus")}</TableHead>
                  <TableHead className="text-right">{t("revisor.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carpetasFiltradas.map((c) => (
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
          )}
        </div>
      </section>
    </div>
  );
}
