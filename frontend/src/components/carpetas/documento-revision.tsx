"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import { Badge } from "@/components/tailgrids/core/badge";
import {
  apiEvaluarDocumento,
  CarpetaDetail,
  DocumentoEntrega,
} from "@/lib/api";
import { DescargaDocumento } from "./descarga-documento";

interface DocumentoRevisionProps {
  documento: DocumentoEntrega;
  entregaId: number;
  editable: boolean;
  comment?: string;
  onCommentChange?: (value: string) => void;
  onSavingChange?: (value: boolean) => void;
  onSaved?: () => void;
  onUpdated: (carpeta: CarpetaDetail) => void;
}

export function DocumentoRevision({
  documento,
  entregaId,
  editable,
  onUpdated,
  comment, onCommentChange, onSavingChange, onSaved,
}: DocumentoRevisionProps) {
  const [localComment, setLocalComment] = useState(documento.comentario ?? "");
  const comentario = comment ?? localComment;
  const locked = useRef(false);
  const [saveError, setSaveError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (dictamen: "aprobado" | "observado") => {
    if (locked.current) return;
    locked.current = true;
    setGuardando(true);
    setSaveError("");
    onSavingChange?.(true);

    try {
      onUpdated(
        await apiEvaluarDocumento(
          entregaId,
          documento.id,
          dictamen,
          comentario,
        ),
      );
      onSaved?.();
      toast.success(
        "Evaluación guardada. Falta concluir el dictamen de la entrega.",
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar la evaluación.");
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la evaluación.",
      );
    } finally {
      locked.current = false;
      setGuardando(false);
      onSavingChange?.(false);
    }
  };

  return (
    <div id={`review-document-${documento.id}`} role="region" aria-label={documento.titulo} tabIndex={-1} className="space-y-3 border-t border-card-border py-4 focus-visible:outline-2 focus-visible:outline-brand-500">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold text-text-primary">
            {documento.titulo}
          </h3>
          <p className="break-words text-xs text-text-secondary">
            {documento.nombre} · versión {documento.version}
          </p>
          <Badge
            color={
              documento.dictamen === "observado"
                ? "warning"
                : documento.dictamen === "aprobado"
                  ? "success"
                  : "gray"
            }
            size="sm"
          >
            {documento.dictamen === "aprobado"
              ? "Conforme"
              : documento.dictamen === "observado"
                ? "Observado"
                : "Pendiente de evaluación"}
          </Badge>
        </div>
        <DescargaDocumento
          documentoId={documento.documento_id}
          nombre={documento.nombre}
        />
      </div>
      {documento.comentario && (
        <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
          {documento.comentario}
        </p>
      )}
      {documento.dictamen === "observado" && (
        <p className="text-xs text-text-tertiary">
          {documento.subsanada_en_entrega_id
            ? `Subsanación confirmada en entrega #${documento.subsanada_en_entrega_id}.`
            : "Subsanación pendiente de confirmación por el Director."}
        </p>
      )}
      {editable && (
        <div className="space-y-2">
          <label
            htmlFor={`comentario-${documento.id}`}
            className="block text-xs font-medium text-text-secondary"
          >
            Comentario de evaluación (obligatorio para observar)
          </label>
          <textarea
            id={`comentario-${documento.id}`}
            value={comentario}
            onChange={(event) => onCommentChange ? onCommentChange(event.target.value) : setLocalComment(event.target.value)}
            maxLength={5000}
            rows={2}
            disabled={guardando}
            aria-describedby={saveError ? `review-error-${documento.id}` : undefined}
            className="w-full rounded-lg border border-card-border bg-card-surface-area p-3 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          />
          {saveError && <p id={`review-error-${documento.id}`} role="alert" className="text-sm text-badge-warning-text">{saveError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              size="sm"
              variant="success"
              isDisabled={guardando}
              onPress={() => guardar("aprobado")}
            >
              Marcar conforme
            </Button>
            <Button
              className="min-h-11"
              size="sm"
              variant="danger"
              appearance="outline"
              isDisabled={guardando || !comentario.trim()}
              onPress={() => guardar("observado")}
            >
              Guardar observación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
