"use client";

import { Button } from "@/components/tailgrids/core/button";
import { EntregaCarpeta } from "@/lib/api";

interface ReviewProgressProps {
  entrega: EntregaCarpeta;
  processing: boolean;
  unsaved?: boolean;
  onNext: () => void;
  onConclude: () => void;
}

export function ReviewProgress({ entrega, processing, unsaved = false, onNext, onConclude }: ReviewProgressProps) {
  const pending = entrega.detalles.filter(item => item.dictamen === "pendiente").length;
  const observed = entrega.detalles.filter(item => item.dictamen === "observado").length;
  const total = entrega.detalles.length;

  return <div className="space-y-3 border-t border-card-border pt-4" aria-label="Progreso de evaluación">
    <p role="status" className="font-medium tabular-nums text-text-primary">{total - pending}/{total} documentos evaluados · {pending} pendientes · {observed} observados</p>
    <p className="text-sm text-text-secondary">Guardar una evaluación no emite el dictamen de la entrega.</p>
    {pending > 0 && <p id="review-conclude-help" className="text-sm text-text-secondary">Evalúa los {pending} documentos pendientes antes de concluir el dictamen.</p>}
    {unsaved && <p role="status" className="text-sm text-badge-warning-text">Guarda o descarta los comentarios modificados antes de concluir.</p>}
    <div className="flex flex-wrap gap-3">
      <Button className="min-h-11" appearance="outline" isDisabled={processing || pending === 0} onPress={onNext}>Siguiente pendiente</Button>
      <Button className="min-h-11" isDisabled={processing || pending > 0 || total === 0 || unsaved} aria-describedby={pending > 0 ? "review-conclude-help" : undefined} onPress={onConclude}>Concluir dictamen de la entrega</Button>
    </div>
  </div>;
}
