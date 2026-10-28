"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/tailgrids/core/button";
import { useNavigationGuard } from "@/context/navigation-guard";
import { CarpetaDetail, EntregaCarpeta } from "@/lib/api";
import { DocumentoRevision } from "./documento-revision";
import { ReviewProgress } from "./review-progress";

interface ReviewWorkspaceProps {
  entrega: EntregaCarpeta;
  processing: boolean;
  onUpdated: (folder: CarpetaDetail) => void;
  onConclude: () => void;
}

export function ReviewWorkspace({ entrega, processing, onUpdated, onConclude }: ReviewWorkspaceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const { register } = useNavigationGuard();
  const active = entrega.detalles.find(item => item.id === selected) || entrega.detalles[0];
  const dirty = entrega.detalles.some(item => drafts[item.id] !== undefined && drafts[item.id] !== (item.comentario || ""));
  const discard = useCallback(() => setDrafts({}), []);

  useEffect(() => {
    register(dirty || saving, discard, saving);

    return () => register(false, () => {});
  }, [dirty, saving, discard, register]);

  const nextPending = () => {
    const items = entrega.detalles;
    const index = items.findIndex(item => item.id === active?.id);
    const ordered = [...items.slice(index + 1), ...items.slice(0, index + 1)];
    const next = ordered.find(item => item.dictamen === "pendiente");

    if (!next) return;

    setSelected(next.id);
    requestAnimationFrame(() => document.getElementById(`review-document-${next.id}`)?.focus());
  };

  return <section aria-label="Entrega en revisión" className="space-y-5">
    <h3 className="text-base font-semibold text-text-primary">{entrega.hito} · intento {entrega.numero}</h3>
    <ReviewProgress entrega={entrega} processing={processing || saving} unsaved={dirty} onNext={nextPending} onConclude={onConclude} />
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(14rem,1fr)_minmax(0,2fr)]">
      <nav aria-label="Documentos de la entrega" className="min-w-0 space-y-1">
        {entrega.detalles.map(item => <button key={item.id} type="button" disabled={saving} aria-current={active?.id === item.id ? "true" : undefined} onClick={() => setSelected(item.id)} className="min-h-11 w-full rounded-lg border border-card-border px-4 py-3 text-left text-sm text-text-primary aria-[current=true]:bg-brand-100 aria-[current=true]:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60">
          <span className="block break-words font-medium">{item.titulo}</span>
          <span className="mt-1 block text-xs">{item.dictamen === "pendiente" ? "Pendiente" : item.dictamen === "aprobado" ? "Conforme" : "Observado"}{drafts[item.id] !== undefined && drafts[item.id] !== (item.comentario || "") ? " · comentario sin guardar" : ""}</span>
        </button>)}
      </nav>
      <div ref={panel} className="min-w-0">
        {active ? <DocumentoRevision key={active.id} documento={active} entregaId={entrega.id} editable onUpdated={onUpdated}
          comment={drafts[active.id] ?? active.comentario ?? ""}
          onCommentChange={value => setDrafts(previous => ({ ...previous, [active.id]: value }))}
          onSavingChange={setSaving}
          onSaved={() => setDrafts(previous => { const next = { ...previous }; delete next[active.id];

 return next; })}
        /> : <p className="text-sm text-text-secondary">Esta entrega no contiene documentos.</p>}
      </div>
    </div>
    {dirty && <Button appearance="outline" isDisabled={saving} onPress={discard}>Descartar comentarios sin guardar</Button>}
  </section>;
}
