"use client";

import { CicloCarpeta } from "@/components/carpetas/ciclo-carpeta";
import { DescargaDocumento } from "@/components/carpetas/descarga-documento";

import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import {
  SheetContent,
  SheetOverlay,
  SheetTitle,
} from "@/components/tailgrids/core/sheet";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import {
  apiFetchCarpetaDetalle,
  CarpetaDetail,
  SeccionCarpeta,
} from "@/lib/api";
import { cn } from "@/utils/cn";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RevisorCarpetaDetallePage() {
  const params = useParams();
  const carpetaId = Number(params?.id);

  return <CarpetaContent key={carpetaId} carpetaId={carpetaId} />;
}

function CarpetaContent({ carpetaId }: { carpetaId: number }) {
  const router = useRouter();

  const [carpeta, setCarpeta] = useState<CarpetaDetail | null>(null);

  const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!carpetaId) return;
    apiFetchCarpetaDetalle(carpetaId)
      .then((data) => {
        setCarpeta(data);

        const porRevisar = data.secciones.find(
          (s) => s.estado === "entregado" || s.estado === "observado",
        );

        setSelectedSeccionId(
          porRevisar ? porRevisar.id : (data.secciones[0]?.id ?? null),
        );
      })
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "Error al cargar carpeta",
        ),
      )
      .finally(() => setLoading(false));
  }, [carpetaId]);

  if (loading) {
    return (
      <div className="px-4 py-7 sm:px-7 lg:px-10">
        <Card className="py-12 text-center">
          <p className="text-sm text-text-tertiary">
            Cargando carpeta para dictamen...
          </p>
        </Card>
      </div>
    );
  }

  if (!carpeta) {
    return (
      <div className="px-4 py-7 sm:px-7 lg:px-10">
        <Card className="py-8 text-center">
          <p className="text-sm text-badge-error-text">
            Carpeta no encontrada.
          </p>
        </Card>
      </div>
    );
  }

  const { curso, docente, semestre, metricas, secciones, historial } = carpeta;

  const seccionActiva =
    secciones.find((s) => s.id === selectedSeccionId) || secciones[0];

  const getEstadoColor = (estado: SeccionCarpeta["estado"]) => {
    switch (estado) {
      case "aprobado":
        return "success";
      case "observado":
        return "warning";
      case "entregado":
        return "blue";
      default:
        return "gray";
    }
  };

  return (
    <div className="space-y-6 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      {/* Cabecera Superior del Dictaminador */}
      <div className="border-b border-card-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                appearance="outline"
                size="xs"
                onPress={() => router.push("/revisor")}
              >
                Volver a revisión
              </Button>
              <Badge color="primary" size="sm">
                {curso.codigo}
              </Badge>
              <Badge color="warning" size="sm">
                Docente: {docente.nombre}
              </Badge>
            </div>
            <h1 className="text-xl font-semibold text-text-primary md:text-2xl">
              Revisión: {curso.nombre} (Sección {carpeta.seccion} ·{" "}
              {semestre.nombre})
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-56">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-badge-success-text">
                  Documentos aprobados
                </span>
                <span className="text-text-primary">
                  {metricas.porcentaje_aprobacion}% ({metricas.aprobadas}/
                  {metricas.total_obligatorias})
                </span>
              </div>
              <Progress
                progress={metricas.porcentaje_aprobacion}
                className="max-w-full"
                barColor="var(--color-badge-success-text)"
              />
            </div>

            <Button
              variant="primary"
              appearance="outline"
              size="sm"
              onPress={() => setDrawerOpen(true)}
            >
              Ver historial ({historial.length})
            </Button>
          </div>
        </div>
      </div>

      <CicloCarpeta carpeta={carpeta} onUpdated={setCarpeta} director />

      {/* Cockpit Master-Detail del Revisor (2 Columnas) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Columna Izquierda (4/12): Lista de 10 Secciones para Inspección */}
        <div className="lg:col-span-4">
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-card-border bg-background-gray-primary px-4 py-3.5">
              <h2 className="text-base font-semibold text-text-primary">
                Documentos del curso
              </h2>
              <p className="text-xs text-text-tertiary">
                {metricas.entregadas} pendientes de visto bueno ·{" "}
                {metricas.observadas} observadas
              </p>
            </div>

            <div className="max-h-64 divide-y divide-card-border overflow-y-auto lg:max-h-none">
              {secciones.map((sec) => {
                const isSelected = seccionActiva?.id === sec.id;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedSeccionId(sec.id);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-150",
                      isSelected
                        ? "bg-brand-100 text-brand-600"
                        : "hover:bg-background-gray-primary/60",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-snug text-text-primary",
                          isSelected ? "font-semibold" : "font-medium",
                        )}
                      >
                        {sec.plantilla.nombre}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge color={getEstadoColor(sec.estado)} size="sm">
                          {sec.estado.charAt(0).toUpperCase() +
                            sec.estado.slice(1)}
                        </Badge>
                        <span className="text-xs text-text-tertiary">
                          {sec.documentos.length} archivo(s)
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Columna Derecha (8/12): Dictamen e Inspección de Archivos de la Sección Activa */}
        <div className="lg:col-span-8">
          {seccionActiva && (
            <Card className="space-y-5">
              <p className="text-sm text-text-secondary">
                Biblioteca de versiones de la carpeta. La evaluación se realiza
                sobre los documentos de la entrega presentada, en el panel
                superior.
              </p>

              <CardHeader className="border-b border-card-border pb-3">
                <div>
                  <CardTitle className="text-xl">
                    {seccionActiva.plantilla.nombre}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {seccionActiva.plantilla.descripcion}
                  </CardDescription>
                </div>
              </CardHeader>

              {/* Observaciones Registradas */}
              {seccionActiva.observaciones.length > 0 && (
                <div className="space-y-2.5">
                  {seccionActiva.observaciones.map((obs) => (
                    <div
                      key={obs.id}
                      className={cn(
                        "rounded-xl p-4 text-sm",
                        obs.resuelta
                          ? "bg-background-gray-primary"
                          : "bg-badge-warning-background",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-semibold text-text-primary">
                          {obs.resuelta
                            ? "Observación subsanada"
                            : "Observación pendiente"}{" "}
                          · {obs.revisor_nombre}
                        </span>
                        <Badge
                          color={obs.resuelta ? "blue" : "warning"}
                          size="sm"
                        >
                          {obs.resuelta ? "Subsanada" : "Pendiente"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-text-secondary">{obs.texto}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Archivos Presentados por el Docente */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-text-secondary">
                  Versiones del documento ({seccionActiva.documentos.length})
                </h4>

                {seccionActiva.documentos.length === 0 ? (
                  <div className="rounded-xl border border-card-border bg-background-gray-primary p-6 text-center text-sm text-text-tertiary">
                    El docente aún no ha cargado documentos en esta sección.
                  </div>
                ) : (
                  <TableRoot>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Versión</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead>Fecha de Entrega</TableHead>
                        <TableHead className="text-right">
                          Inspeccionar
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seccionActiva.documentos.map((d, idx) => (
                        <TableRow key={d.id}>
                          <TableCell>
                            <Badge
                              color={idx === 0 ? "primary" : "gray"}
                              size="sm"
                            >
                              v{d.version}
                              {idx === 0 ? " · ÚLTIMA" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-text-primary">
                            {d.nombre}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {d.tamano_mb} MB
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {new Date(d.fecha).toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell className="text-right">
                            <DescargaDocumento
                              documentoId={d.id}
                              nombre={d.nombre}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableRoot>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Sheet Lateral de Historial de carpeta */}
      <SheetOverlay isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-96 max-w-full border-l border-card-border bg-card-surface-area p-5 overflow-y-auto"
        >
          <SheetTitle className="text-lg font-semibold text-text-primary">
            Historial de carpeta
          </SheetTitle>
          <p className="mt-1 text-xs text-text-tertiary">
            Registro cronológico de auditoría de esta carpeta.
          </p>
          <div className="mt-4 divide-y divide-card-border">
            {historial.map((h) => (
              <div key={h.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge color="primary" size="sm">
                    {h.accion}
                  </Badge>
                  <span className="text-[11px] text-text-tertiary">
                    {new Date(h.fecha).toLocaleString("es-PE")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-text-primary">{h.detalle}</p>
                <p className="mt-0.5 text-xs font-medium text-text-secondary">
                  Por: {h.usuario_nombre} ({h.usuario_rol.toUpperCase()})
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </SheetOverlay>
    </div>
  );
}
