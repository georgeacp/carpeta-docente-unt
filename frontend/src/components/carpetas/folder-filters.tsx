"use client";

import { CarpetaSummary } from "@/lib/api";
import { useFolderFilters } from "@/hooks/use-folder-filters";
import { useI18n } from "@/context/i18n-context";
import { Button } from "@/components/tailgrids/core/button";

const field =
  "min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500 sm:text-sm";

export function FolderFilters({
  carpetas,
  filters,
  director = false,
}: {
  carpetas: CarpetaSummary[];
  filters: ReturnType<typeof useFolderFilters>;
  director?: boolean;
}) {
  const { t } = useI18n();

  const semestres = [
    ...new Map(carpetas.map((c) => [c.semestre.id, c.semestre])).values(),
  ];

  const cursos = [
    ...new Map(carpetas.map((c) => [c.curso.id, c.curso])).values(),
  ];

  const docentes = [
    ...new Map(carpetas.map((c) => [c.docente.id, c.docente])).values(),
  ];

  return (
    <div className="mb-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm text-text-secondary">
          {t("modules.search")}
          <input
            type="search"
            className={field}
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-text-secondary">
          {t("modules.semester")}
          <select
            className={field}
            value={filters.get("semestre")}
            onChange={(e) => filters.set("semestre", e.target.value)}
          >
            <option value="">{t("modules.all")}</option>
            {semestres.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-text-secondary">
          {t("modules.state")}
          <select
            className={field}
            value={filters.get("estado")}
            onChange={(e) => filters.set("estado", e.target.value)}
          >
            <option value="">{t("modules.all")}</option>
            {[
              "en_progreso",
              "completa_en_revision",
              "observada",
              "aprobada",
            ].map((s) => (
              <option key={s} value={s}>
                {t(`modules.${s}`)}
              </option>
            ))}
          </select>
        </label>
        {director && (
          <>
            <label className="space-y-1 text-sm text-text-secondary">
              {t("modules.course")}
              <select
                className={field}
                value={filters.get("curso")}
                onChange={(e) => filters.set("curso", e.target.value)}
              >
                <option value="">{t("modules.all")}</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-text-secondary">
              {t("modules.teacher")}
              <select
                className={field}
                value={filters.get("docente")}
                onChange={(e) => filters.set("docente", e.target.value)}
              >
                <option value="">{t("modules.all")}</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
      <Button appearance="outline" onPress={filters.clear}>
        {t("modules.clear")}
      </Button>
    </div>
  );
}
