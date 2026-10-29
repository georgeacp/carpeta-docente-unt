"use client";

import { toast } from "sonner";
import { useCallback, useState } from "react";
import { useI18n } from "@/context/i18n-context";
import { RequestError } from "@/components/common/request-error";
import { Button } from "@/components/tailgrids/core/button";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { useRemoteData } from "@/hooks/use-remote-data";
import { useSubmission } from "@/hooks/use-submission";
import {
  apiFetchConfiguracion,
  apiGuardarConfiguracion,
  CatalogoAdmin,
  ConfiguracionCurso,
} from "@/lib/api";
import { academicDeadline } from "@/lib/academic-dates";

const input =
  "min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500 sm:text-sm";

export function Configuracion({ catalogo }: { catalogo: CatalogoAdmin }) {
  const { t } = useI18n();
  const [curso, setCurso] = useState(catalogo.cursos[0]?.id ?? 0);

  const [semestre, setSemestre] = useState(
    catalogo.semestres.find((s) => s.activo)?.id ??
      catalogo.semestres[0]?.id ??
      0,
  );

  return (
    <section className="space-y-6">
      <p className="max-w-3xl text-sm leading-6 text-text-secondary">
        {t("modules.configHint")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-text-secondary">
          {t("modules.course")}
          <select
            aria-label={t("modules.course")}
            className={input}
            value={curso}
            onChange={(e) => setCurso(Number(e.target.value))}
          >
            {catalogo.cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} · {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-text-secondary">
          {t("modules.semester")}
          <select
            aria-label={t("modules.semester")}
            className={input}
            value={semestre}
            onChange={(e) => setSemestre(Number(e.target.value))}
          >
            {catalogo.semestres.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      {curso && semestre ? (
        <ConfigurationLoader
          key={`${curso}-${semestre}`}
          curso={curso}
          semestre={semestre}
          catalogo={catalogo}
        />
      ) : (
        <p className="text-text-secondary">{t("modules.needCatalog")}</p>
      )}
    </section>
  );
}

function ConfigurationLoader({
  curso,
  semestre,
  catalogo,
}: {
  curso: number;
  semestre: number;
  catalogo: CatalogoAdmin;
}) {
  const { t } = useI18n();

  const load = useCallback(
    (signal: AbortSignal) => apiFetchConfiguracion(curso, semestre, signal),
    [curso, semestre],
  );

  const { data, error, loading, reload, setData } = useRemoteData(load);

  return (
    <div className="space-y-4">
      <Button appearance="outline" isDisabled={loading} onPress={reload}>
        {t("modules.refresh")}
      </Button>
      {error && (
        <RequestError
          error={error}
          onRetry={reload}
          pending={loading}
          stale={!!data}
        />
      )}
      {loading ? (
        <p role="status" className="text-text-secondary">
          {t("common.loading")}
        </p>
      ) : (
        data && (
          <ConfigurationEditor
            key={data.version}
            initial={data}
            catalogo={catalogo}
            onSaved={(value) => {
              setData(value);
              toast.success(t("modules.saved"));
            }}
          />
        )
      )}
    </div>
  );
}

function limaInput(iso: string) {
  return new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function ConfigurationEditor({
  initial,
  catalogo,
  onSaved,
}: {
  initial: ConfiguracionCurso;
  catalogo: CatalogoAdmin;
  onSaved: (value: ConfiguracionCurso) => void;
}) {
  const { t } = useI18n();
  const [hitos, setHitos] = useState(initial.hitos);
  const state = useSubmission();

  return (
    <form
      className="space-y-5"
      aria-describedby="configuration-feedback"
      onSubmit={(e) => {
        e.preventDefault();
        void state.run(async () =>
          onSaved(await apiGuardarConfiguracion({ ...initial, hitos })),
        );
      }}
    >
      <p role="status" className="text-sm font-medium text-text-secondary">
        {initial.bloqueada ? t("modules.locked") : t("modules.editable")}
      </p>
      <fieldset
        disabled={initial.bloqueada || state.pending}
        className="min-w-0 space-y-6"
      >
        <legend className="sr-only">{t("modules.configuracion")}</legend>
        {hitos.map((hito, index) => (
          <fieldset
            key={hito.codigo}
            className="min-w-0 space-y-4 rounded-xl border border-card-border p-4 sm:p-5"
          >
            <legend className="px-2 text-base font-semibold text-text-primary">
              {t(`modules.${hito.codigo}`)}
            </legend>
            <label className="block max-w-sm space-y-2 text-sm text-text-secondary">
              {t("modules.deadline")}
              <input
                type="datetime-local"
                required
                aria-label={`${t(`modules.${hito.codigo}`)} · ${t("modules.deadline")}`}
                className={input}
                value={limaInput(hito.fecha_limite)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [date, time] = e.target.value.split("T");
                  setHitos(
                    hitos.map((h, i) =>
                      i === index
                        ? { ...h, fecha_limite: academicDeadline(date, time) }
                        : h,
                    ),
                  );
                }}
              />
            </label>
            <div className="grid gap-x-6 gap-y-2 lg:grid-cols-2">
              {catalogo.plantillas.map((item) => (
                <Checkbox
                  key={item.id}
                  className="min-h-11 text-sm text-text-primary"
                  isSelected={hito.item_ids.includes(item.id)}
                  isDisabled={
                    initial.bloqueada ||
                    state.pending ||
                    (hito.codigo === "cierre" && item.obligatoria)
                  }
                  onChange={(selected) =>
                    setHitos(
                      hitos.map((h, i) =>
                        i === index
                          ? {
                              ...h,
                              item_ids: selected
                                ? [...h.item_ids, item.id]
                                : h.item_ids.filter((id) => id !== item.id),
                            }
                          : h,
                      ),
                    )
                  }
                >
                  <span>
                    {item.nombre}
                    <span className="block text-xs text-text-tertiary">
                      {t(
                        item.obligatoria
                          ? "modules.required"
                          : "modules.optional",
                      )}{" "}
                      · {item.tipos_permitidos.toUpperCase()}
                    </span>
                  </span>
                </Checkbox>
              ))}
            </div>
          </fieldset>
        ))}
        <Button type="submit" isDisabled={initial.bloqueada || state.pending}>
          {state.pending ? t("modules.saving") : t("modules.saveConfig")}
        </Button>
      </fieldset>
      <div
        id="configuration-feedback"
        aria-live="polite"
        className="text-sm text-text-secondary"
      >
        {state.error && (
          <p role="alert" className="text-badge-warning-text">
            {state.error}
          </p>
        )}
        {state.completed && t("modules.saved")}
      </div>
    </form>
  );
}
