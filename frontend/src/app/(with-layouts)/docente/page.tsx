"use client";

import { CourseFolder } from "@/components/carpetas/course-folder";
import { FolderListState } from "@/components/carpetas/folder-list-state";
import { SummaryStrip } from "@/components/carpetas/summary-strip";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { apiFetchMisCarpetas, CarpetaSummary } from "@/lib/api";
import { useEffect, useState, Suspense } from "react";
import { FolderFilters } from "@/components/carpetas/folder-filters";
import { useFolderFilters } from "@/hooks/use-folder-filters";
import { toast } from "sonner";

export default function DocenteDashboardPage() {
  return (
    <Suspense>
      <DocenteDashboard />
    </Suspense>
  );
}

function DocenteDashboard() {
  const { usuario } = useAuth();
  const { t } = useI18n();
  const [carpetas, setCarpetas] = useState<CarpetaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    apiFetchMisCarpetas()
      .then((data) => {
        if (active) setCarpetas(data);
      })
      .catch((err) => {
        if (active) {
          setError(true);
          toast.error(
            err instanceof Error ? err.message : "Error al cargar carpetas",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [usuario, retry]);

  const filters = useFolderFilters(carpetas);
  const visibles = filters.filtered;

  const totalObservadas = carpetas.reduce(
    (acc, c) => acc + c.metricas.observadas,
    0,
  );

  const totalAprobadas = carpetas.reduce(
    (acc, c) => acc + c.metricas.aprobadas,
    0,
  );

  const totalEntregadas = carpetas.reduce(
    (acc, c) => acc + c.metricas.entregadas,
    0,
  );

  const promedioAvance =
    carpetas.length > 0
      ? Math.round(
          carpetas.reduce((acc, c) => acc + c.metricas.porcentaje_avance, 0) /
            carpetas.length,
        )
      : 0;

  return (
    <div className="space-y-8 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
          {t("docente.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          {t("docente.desc")}
        </p>
      </div>

      <SummaryStrip
        loading={loading}
        items={[
          {
            label: t("docente.kpiFolders"),
            value: error ? "—" : carpetas.length,
            hint: t("docente.kpiTeachingLoad"),
          },
          {
            label: t("docente.kpiProgress"),
            value: error ? "—" : `${promedioAvance}%`,
            hint: t("docente.kpiRequired"),
          },
          {
            label: t("docente.kpiApproved"),
            value: error ? "—" : totalAprobadas,
            hint: t("docente.kpiInReview", { count: totalEntregadas }),
          },
          {
            label: t("docente.kpiObs"),
            value: error ? "—" : totalObservadas,
            hint:
              totalObservadas > 0
                ? t("docente.kpiNewVersion")
                : t("docente.kpiNoObs"),
            attention: totalObservadas > 0,
          },
        ]}
      />

      {!loading && !error && totalObservadas > 0 && (
        <div
          role="status"
          className="flex flex-col gap-1 rounded-xl bg-badge-warning-background px-5 py-4 text-badge-warning-text"
        >
          <p className="text-sm font-medium">
            {t("docente.alertObs", { count: totalObservadas })}
          </p>
          <p className="text-sm leading-6">{t("docente.alertHint")}</p>
        </div>
      )}

      <section aria-labelledby="course-list-title">
        <FolderFilters carpetas={carpetas} filters={filters} />
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2
            id="course-list-title"
            className="text-base font-semibold text-text-primary"
          >
            {t("docente.coursesTitle")}
          </h2>
          {!loading && !error && (
            <span className="text-sm tabular-nums text-text-tertiary">
              {t("docente.foldersCount", { count: visibles.length })}
            </span>
          )}
        </div>
        <div
          aria-busy={loading}
          className="overflow-hidden rounded-xl border border-card-border bg-card-background"
        >
          {loading ? (
            <div role="status" className="divide-y divide-card-border">
              <span className="sr-only">{t("docente.syncing")}</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="flex h-36 flex-col justify-center gap-3 px-6 motion-safe:animate-pulse"
                >
                  <div className="h-3 w-24 rounded bg-background-gray-secondary" />
                  <div className="h-5 w-3/5 rounded bg-background-gray-secondary" />
                  <div className="h-3 w-2/5 rounded bg-background-gray-secondary" />
                </div>
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
          ) : visibles.length === 0 ? (
            <FolderListState
              title={t("docente.emptyTitle")}
              description={t("docente.emptyHint")}
              retryLabel={t("modules.clear")}
              onRetry={filters.clear}
            />
          ) : (
            visibles.map((carpeta) => (
              <CourseFolder key={carpeta.id} carpeta={carpeta} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
