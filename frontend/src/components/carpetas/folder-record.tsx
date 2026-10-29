"use client";

import { CarpetaDetail } from "@/lib/api";
import { useI18n } from "@/context/i18n-context";
import { formatAcademicDeadline } from "@/lib/academic-dates";
import { DocumentoRevision } from "./documento-revision";

export function FolderObservations({ carpeta }: { carpeta: CarpetaDetail }) {
  const { t } = useI18n();

  const entregas = carpeta.ciclo.entregas.filter(
    (e) =>
      e.estado !== "pendiente" &&
      e.detalles.some((d) => d.dictamen === "observado"),
  );

  const antiguas = carpeta.secciones.flatMap((s) =>
    s.observaciones.map((o) => ({ ...o, titulo: s.plantilla.nombre })),
  );

  return (
    <section className="space-y-4" aria-label={t("modules.observaciones")}>
      <h2 className="text-lg font-semibold text-text-primary">
        {t("modules.observaciones")}
      </h2>
      {!entregas.length && !antiguas.length && (
        <p className="text-text-secondary">{t("modules.noObservations")}</p>
      )}
      {entregas.map((e) => (
        <article
          key={e.id}
          className="rounded-xl border border-card-border p-4"
        >
          <h3 className="font-medium text-text-primary">
            {e.hito} · {t("modules.attempt")} {e.numero}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {e.director_nombre} ·{" "}
            {e.dictaminada_en && formatAcademicDeadline(e.dictaminada_en)}
          </p>
          {e.detalles
            .filter((d) => d.dictamen === "observado")
            .map((d) => (
              <DocumentoRevision
                key={d.id}
                documento={d}
                entregaId={e.id}
                editable={false}
                onUpdated={() => {}}
              />
            ))}
        </article>
      ))}
      {antiguas.map((o) => (
        <article
          key={o.id}
          className="space-y-2 rounded-xl border border-card-border p-4 text-sm text-text-secondary"
        >
          <h3 className="font-medium text-text-primary">{o.titulo}</h3>
          <p>{o.texto}</p>
          <p>
            {o.revisor_nombre} · {formatAcademicDeadline(o.fecha)} ·{" "}
            {t(o.resuelta ? "modules.resolved" : "modules.unresolved")}
          </p>
        </article>
      ))}
    </section>
  );
}

export function FolderHistory({ carpeta }: { carpeta: CarpetaDetail }) {
  const { t } = useI18n();

  return (
    <section aria-label={t("modules.historial")} className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        {t("modules.historial")}
      </h2>
      {!carpeta.historial.length && (
        <p className="text-text-secondary">{t("modules.noHistory")}</p>
      )}
      <ol className="divide-y divide-card-border">
        {carpeta.historial.map((h) => (
          <li key={h.id} className="space-y-2 py-4">
            <p className="text-sm text-text-tertiary">
              {formatAcademicDeadline(h.fecha)} · {h.usuario_nombre}
            </p>
            <p className="text-sm text-text-primary">{h.detalle}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
