"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Dialog, DialogTitle } from "@/components/tailgrids/core/dialog";
import { apiConcluirEntrega, apiEnviarEntrega, CarpetaDetail } from "@/lib/api";
import { ReviewProgress } from "./review-progress";
import { DocumentoRevision } from "./documento-revision";

interface CicloCarpetaProps {
  carpeta: CarpetaDetail;
  director?: boolean;
  onUpdated: (carpeta: CarpetaDetail) => void;
}

const fecha = (valor: string) =>
  new Date(valor).toLocaleString("es-PE", { timeZone: "America/Lima" });

export function CicloCarpeta({
  carpeta,
  director = false,
  onUpdated,
}: CicloCarpetaProps) {
  const [hitoId, setHitoId] = useState<number | null>(null);

  const [confirmar, setConfirmar] = useState<"enviar" | "dictaminar" | null>(
    null,
  );

  const [procesando, setProcesando] = useState(false);
  const ciclo = carpeta.ciclo;
  const aprobados = new Set<number>();

  for (const entrega of ciclo.entregas) {
    if (entrega.estado === "aprobada") aprobados.add(entrega.hito_id);
  }

  const hito =
    ciclo.hitos.find(
      (actual) => actual.id === hitoId && !aprobados.has(actual.id),
    ) ??
    ciclo.hitos.find(
      (actual) =>
        ciclo.estado === "observada" &&
        actual.id === ciclo.entregas[0]?.hito_id,
    ) ??
    ciclo.hitos.find((actual) => !aprobados.has(actual.id)) ??
    ciclo.hitos[0];

  const pendientes: string[] = [];

  if (hito) {
    for (const seccion of carpeta.secciones) {
      if (
        (hito.codigo === "cierre" ||
          hito.item_ids.includes(seccion.plantilla.id)) &&
        seccion.plantilla.obligatoria &&
        seccion.documentos.length === 0
      )
        pendientes.push(seccion.plantilla.nombre);
    }
  }

  const pendiente = ciclo.entregas.find(
    (entrega) => entrega.estado === "pendiente",
  );

  const [lastFocused, setLastFocused] = useState<number | null>(null);

  const nextPending = () => {
    const items = pendiente?.detalles.filter(item => item.dictamen === "pendiente") || [];
    const index = items.findIndex(item => item.id === lastFocused);
    const next = items[(index + 1) % items.length];

    if (!next) return;
    setLastFocused(next.id);
    document.getElementById(`review-document-${next.id}`)?.focus();
  };

  const resultado = pendiente?.detalles.some(
    (detalle) => detalle.dictamen === "observado",
  )
    ? "observada"
    : "aprobada";

  const reenviando = ciclo.entregas.some(
    (entrega) => entrega.hito_id === hito?.id && entrega.estado === "observada",
  );

  const ejecutar = async () => {
    setProcesando(true);

    try {
      if (confirmar === "enviar" && hito) {
        onUpdated(await apiEnviarEntrega(carpeta.id, hito.id));
        toast.success(
          "Entrega presentada. La carpeta queda bloqueada durante la revisión.",
        );
      } else if (confirmar === "dictaminar" && pendiente) {
        onUpdated(await apiConcluirEntrega(pendiente.id));
        toast.success("Dictamen integral registrado.");
      }

      setConfirmar(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo completar la operación.",
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section aria-label="Ciclo de entregas">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Entregas y revisión
          </h2>
          <Badge
            color={
              ciclo.estado === "aprobada"
                ? "success"
                : ciclo.estado === "observada"
                  ? "warning"
                  : "blue"
            }
            size="sm"
          >
            {ciclo.estado === "aprobada"
              ? "Carpeta aprobada definitivamente"
              : ciclo.estado.replaceAll("_", " ")}
          </Badge>
        </div>
        <p className="text-sm text-text-secondary">
          Inicio y seguimiento son entregas parciales. Solo la aprobación del
          cierre integral aprueba definitivamente la carpeta.
        </p>
        {director && (
          <Link
            href="/docente"
            className="inline-block text-sm font-medium text-text-brand-primary underline underline-offset-4"
          >
            Ver mis carpetas como docente
          </Link>
        )}
        {ciclo.bloqueada && (
          <p role="status" className="text-sm font-medium text-text-primary">
            {ciclo.estado === "aprobada"
              ? "Carpeta en consulta; el cierre integral ya fue aprobado."
              : "Edición bloqueada mientras el Director revisa las versiones presentadas."}
          </p>
        )}
        {!director && !ciclo.bloqueada && hito && (
          <div className="space-y-3">
            <label
              htmlFor="hito-entrega"
              className="block text-sm font-medium text-text-primary"
            >
              Hito de entrega
            </label>
            <select
              id="hito-entrega"
              value={hito.id}
              onChange={(event) => setHitoId(Number(event.target.value))}
              className="w-full rounded-lg border border-card-border bg-card-surface-area p-2.5 text-sm text-text-primary"
            >
              {ciclo.hitos.map((actual) => (
                <option
                  key={actual.id}
                  value={actual.id}
                  disabled={aprobados.has(actual.id)}
                >
                  {actual.nombre}
                  {aprobados.has(actual.id) ? " · aprobado" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-tertiary">
              Fecha límite: {fecha(hito.fecha_limite)}. Las presentaciones
              tardías se aceptan y quedan identificadas.
            </p>
            {pendientes.length > 0 && (
              <div className="text-sm text-text-secondary">
                <p>Obligatorios pendientes para este hito:</p>
                <ul className="list-disc space-y-1 pl-5">
                  {pendientes.map((nombre) => (
                    <li key={nombre}>{nombre}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              isDisabled={
                procesando || pendientes.length > 0 || aprobados.has(hito.id)
              }
              onPress={() => setConfirmar("enviar")}
            >
              {reenviando ? "Reenviar a revisión" : "Enviar a revisión"}
            </Button>
          </div>
        )}
        {director && pendiente && <ReviewProgress entrega={pendiente} processing={procesando} onNext={nextPending} onConclude={() => setConfirmar("dictaminar")} />}
        <div className="space-y-3">
          {ciclo.entregas.length === 0 && (
            <p className="text-sm text-text-tertiary">
              Aún no hay entregas formales. Los documentos e historial
              anteriores permanecen disponibles.
            </p>
          )}
          {ciclo.entregas.map((entrega, index) => (
            <details
              key={entrega.id}
              open={entrega.estado === "pendiente" || index === 0}
              className="rounded-lg border border-card-border p-4"
            >
              <summary className="cursor-pointer text-sm font-semibold text-text-primary">
                {entrega.hito} · intento {entrega.numero} · {entrega.estado}
                {entrega.tardia ? " · FUERA DE PLAZO" : ""}
              </summary>
              <p className="my-3 text-xs text-text-tertiary">
                Presentada: {fecha(entrega.enviada_en)} · plazo aplicado:{" "}
                {fecha(entrega.fecha_limite)}
                {entrega.dictaminada_en
                  ? ` · dictaminada: ${fecha(entrega.dictaminada_en)}`
                  : ""}
              </p>
              {entrega.director_id && (
                <p className="text-xs text-text-secondary">
                  Director responsable: {entrega.director_nombre || "Nombre no disponible"}
                  {entrega.director_id === carpeta.docente.id
                    ? " · Autorrevisión"
                    : ""}
                </p>
              )}
              {entrega.detalles.map((documento) => (
                <DocumentoRevision
                  key={documento.id}
                  documento={documento}
                  entregaId={entrega.id}
                  editable={director && entrega.estado === "pendiente"}
                  onUpdated={onUpdated}
                />
              ))}
            </details>
          ))}
        </div>
        <Dialog
          isOpen={confirmar !== null}
          onOpenChange={(abierto) => {
            if (!abierto && !procesando) setConfirmar(null);
          }}
          showCloseButton={!procesando}
        >
          <DialogTitle>
            {confirmar === "enviar"
              ? "Confirmar presentación"
              : "Confirmar dictamen integral"}
          </DialogTitle>
          <p className="my-4 text-sm text-text-secondary">
            {confirmar === "enviar"
              ? `Se presentará ${hito?.nombre} con las versiones vigentes de sus documentos. La edición quedará bloqueada hasta recibir el dictamen.`
              : `La entrega quedará ${resultado}. La decisión y sus documentos se conservarán en el historial.`}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              isDisabled={procesando}
              onPress={() => setConfirmar(null)}
            >
              Cancelar
            </Button>
            <Button isDisabled={procesando} onPress={ejecutar}>
              {procesando
                ? "Procesando…"
                : confirmar === "enviar"
                  ? "Confirmar envío"
                  : "Confirmar dictamen"}
            </Button>
          </div>
        </Dialog>
      </Card>
    </section>
  );
}
