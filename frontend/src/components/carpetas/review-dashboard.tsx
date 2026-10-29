"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/context/i18n-context";
import { useRemoteData } from "@/hooks/use-remote-data";
import { useFolderFilters } from "@/hooks/use-folder-filters";
import { apiFetchCarpetasRevisor } from "@/lib/api";
import { RequestError } from "@/components/common/request-error";
import { Button } from "@/components/tailgrids/core/button";
import { FolderFilters } from "./folder-filters";
import { FolderListState } from "./folder-list-state";
import { SummaryStrip } from "./summary-strip";
import { ReviewFolderTable } from "./review-folder-table";

export function ReviewDashboard({
  seguimiento = false,
}: {
  seguimiento?: boolean;
}) {
  const { t } = useI18n();

  const load = useCallback(
    (signal: AbortSignal) => apiFetchCarpetasRevisor("todos", signal),
    [],
  );

  const { data, error, loading, reload } = useRemoteData(load);
  const filters = useFolderFilters(data?.carpetas ?? []);
  const todas = filters.filtered;

  const pendientes = todas.filter(
    (c) =>
      c.seguimiento?.pendiente_revision ??
      ["enviada", "reenviada"].includes(c.estado_ciclo),
  );

  const visibles = seguimiento ? todas : pendientes;

  return (
    <div className="space-y-6 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t(seguimiento ? "modules.tracking" : "modules.inbox")}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {t(seguimiento ? "modules.trackingHint" : "modules.inboxHint")}
          </p>
        </div>
        <Button appearance="outline" onPress={reload} isDisabled={loading}>
          {t("modules.refresh")}
        </Button>
      </header>
      <nav
        aria-label={t("modules.reviewNav")}
        className="flex flex-wrap gap-4 text-sm font-medium text-brand-600"
      >
        <Link aria-current={!seguimiento ? "page" : undefined} href="/revisor">
          {t("modules.inbox")}
        </Link>
        <Link
          aria-current={seguimiento ? "page" : undefined}
          href="/revisor/seguimiento"
        >
          {t("modules.tracking")}
        </Link>
        <Link href="/docente">{t("modules.myFolders")}</Link>
      </nav>
      <FolderFilters
        carpetas={data?.carpetas ?? []}
        filters={filters}
        director
      />
      {error && (
        <RequestError
          error={error}
          onRetry={reload}
          pending={loading}
          stale={!!data}
        />
      )}
      <SummaryStrip
        loading={loading}
        items={[
          {
            label: t("modules.folders"),
            value: error ? "—" : todas.length,
            hint: t("modules.filtered"),
          },
          {
            label: t("modules.pendingReview"),
            value: error ? "—" : pendientes.length,
            hint: t("modules.formalSubmissions"),
          },
          {
            label: t("modules.observada"),
            value: error
              ? "—"
              : todas.filter((c) => c.estado_ciclo === "observada").length,
            hint: t("modules.corrections"),
          },
          {
            label: t("modules.aprobada"),
            value: error
              ? "—"
              : todas.filter((c) => c.estado_ciclo === "aprobada").length,
            hint: t("modules.finalApproval"),
          },
        ]}
      />
      {seguimiento && (
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-text-secondary">
          <p>
            {t("modules.overdue")}:{" "}
            <strong className="text-text-primary">
              {error
                ? "—"
                : todas.reduce(
                    (n, c) =>
                      n + (c.seguimiento?.hitos_vencidos_sin_presentacion ?? 0),
                    0,
                  )}
            </strong>
          </p>
          <p>
            {t("modules.late")}:{" "}
            <strong className="text-text-primary">
              {error
                ? "—"
                : todas.reduce(
                    (n, c) => n + (c.seguimiento?.entregas_tardias ?? 0),
                    0,
                  )}
            </strong>
          </p>
        </div>
      )}
      <section
        aria-label={t(seguimiento ? "modules.tracking" : "modules.inbox")}
        aria-busy={loading}
        className="min-w-0 overflow-hidden rounded-xl border border-card-border"
      >
        {loading ? (
          <p role="status" className="p-6 text-text-secondary">
            {t("common.loading")}
          </p>
        ) : !error && visibles.length ? (
          <ReviewFolderTable carpetas={visibles} />
        ) : !error ? (
          <FolderListState
            title={t("modules.noResults")}
            description={t("modules.noResultsHint")}
            retryLabel={t("modules.clear")}
            onRetry={filters.clear}
          />
        ) : null}
      </section>
    </div>
  );
}
