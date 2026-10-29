"use client";

import Link from "next/link";
import { RequestError } from "@/components/common/request-error";
import { useRemoteData } from "@/hooks/use-remote-data";
import { apiFetchCatalogoAdmin } from "@/lib/api";
import { useI18n } from "@/context/i18n-context";
import { SummaryStrip } from "@/components/carpetas/summary-strip";
import { Asignaciones } from "./asignaciones";
import { Cursos } from "./cursos";
import { Usuarios } from "./usuarios";
import { Semestres } from "./semestres";
import { Configuracion } from "./configuracion";

export type AdminSection =
  | "resumen"
  | "usuarios"
  | "cursos"
  | "semestres"
  | "asignaciones"
  | "configuracion";

const sections: AdminSection[] = [
  "usuarios",
  "cursos",
  "semestres",
  "asignaciones",
  "configuracion",
];

export function CatalogPage({ section }: { section: AdminSection }) {
  const { t } = useI18n();
  const { data, error, loading, reload } = useRemoteData(apiFetchCatalogoAdmin);

  return (
    <div className="space-y-6 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <header>
        <h1 className="text-2xl font-semibold text-text-primary">
          {t(`modules.${section}`)}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {t("modules.adminHint")}
        </p>
      </header>
      <nav aria-label={t("modules.adminNav")} className="flex flex-wrap gap-2">
        {["resumen" as const, ...sections].map((item) => (
          <Link
            key={item}
            aria-current={section === item ? "page" : undefined}
            href={item === "resumen" ? "/admin" : `/admin/${item}`}
            className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium ${section === item ? "bg-brand-100 text-brand-600" : "text-text-secondary hover:bg-background-gray-primary"}`}
          >
            {t(`modules.${item}`)}
          </Link>
        ))}
      </nav>
      {error && (
        <RequestError
          error={error}
          onRetry={reload}
          stale={!!data}
          pending={loading}
        />
      )}
      {loading && !data && (
        <p role="status" className="py-8 text-text-secondary">
          {t("common.loading")}
        </p>
      )}
      {data && (
        <>
          {section === "resumen" && (
            <>
              <SummaryStrip
                items={[
                  {
                    label: t("modules.usuarios"),
                    value: data.usuarios.length,
                    hint: t("modules.registered"),
                  },
                  {
                    label: t("modules.cursos"),
                    value: data.cursos.length,
                    hint: t("modules.registered"),
                  },
                  {
                    label: t("modules.semestres"),
                    value: data.semestres.length,
                    hint: t("modules.registered"),
                  },
                  {
                    label: t("modules.asignaciones"),
                    value: data.asignaciones.length,
                    hint: t("modules.foldersCreated"),
                  },
                ]}
              />
              <p className="text-sm text-text-secondary">
                {t("modules.configHint")}
              </p>
            </>
          )}
          {section === "usuarios" && (
            <Usuarios catalogo={data} onUpdated={reload} />
          )}
          {section === "cursos" && (
            <Cursos catalogo={data} onUpdated={reload} />
          )}
          {section === "semestres" && (
            <Semestres catalogo={data} onUpdated={reload} />
          )}
          {section === "asignaciones" && (
            <Asignaciones catalogo={data} onUpdated={reload} />
          )}
          {section === "configuracion" && <Configuracion catalogo={data} />}
        </>
      )}
    </div>
  );
}
