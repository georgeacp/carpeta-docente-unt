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
  apiSubirDocumento,
  CarpetaDetail,
  SeccionCarpeta,
} from "@/lib/api";
import { cn } from "@/utils/cn";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function DocenteCarpetaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const carpetaId = Number(params?.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [carpeta, setCarpeta] = useState<CarpetaDetail | null>(null);

  const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(
    null,
  );

  const [filtroLista, setFiltroLista] = useState<
    "todas" | "observado" | "pendiente" | "aprobado"
  >("todas");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!carpetaId) return;
    setLoading(true);
    apiFetchCarpetaDetalle(carpetaId)
      .then((data) => {
        setCarpeta(data);
        const obsSec = data.secciones.find((s) => s.estado === "observado");
        setSelectedSeccionId(
          obsSec ? obsSec.id : (data.secciones[0]?.id ?? null),
        );
      })
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "Error al obtener carpeta",
        ),
      )
      .finally(() => setLoading(false));
  }, [carpetaId]);

  const handleFileChange = async (
    seccion: SeccionCarpeta,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file || carpeta?.bloqueada) return;
    e.target.value = "";

    setUploading(true);

    try {
      const updated = await apiSubirDocumento(seccion.id, file);
      setCarpeta(updated);
      toast.success(
        `Nueva versión subida exitosamente ("${file.name}") en ${seccion.plantilla.nombre}.`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al subir el documento",
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 px-2 lg:px-5">
        <Card className="py-12 text-center">
          <p className="text-sm text-text-tertiary">
            Cargando estación de trabajo de Carpeta Docente...
          </p>
        </Card>
      </div>
    );
  }

  if (!carpeta) {
    return (
      <div className="mt-6 px-2 lg:px-5">
        <Card className="py-8 text-center">
          <p className="text-sm text-red-500">
            No se pudo encontrar la carpeta solicitada.
          </p>
        </Card>
      </div>
    );
  }

  const { curso, semestre, metricas, secciones, historial } = carpeta;

  const seccionActiva =
    secciones.find((s) => s.id === selectedSeccionId) || secciones[0];

  const formatosPermitidos =
    (seccionActiva?.plantilla.tipos_permitidos ?? "pdf,docx,xlsx")
      .toLowerCase()
      .match(/\b(?:pdf|docx|xlsx)\b/g) ?? [];

  const seccionesFiltradas = secciones.filter((s) => {
    if (filtroLista === "todas") return true;

    return s.estado === filtroLista;
  });

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
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      {/* Barra Superior de la Carpeta con KPI Compacto y Botón Auditoría */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                appearance="outline"
                size="xs"
                onPress={() => router.push("/docente")}
              >
                ← Mis Cursos
              </Button>
              <Badge color="primary" size="sm">
                {curso.codigo}
              </Badge>
              <Badge color="gray" size="sm">
                Sección {carpeta.seccion} · {semestre.nombre}
              </Badge>
            </div>
            <h1 className="text-xl font-semibold text-text-primary md:text-2xl">
              {curso.nombre}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-56">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-text-secondary">
                  AVANCE OBLIGATORIO (RF8)
                </span>
                <span className="text-text-primary">
                  {metricas.porcentaje_avance}% (
                  {metricas.completadas_obligatorias}/
                  {metricas.total_obligatorias})
                </span>
              </div>
              <Progress
                progress={metricas.porcentaje_avance}
                className="max-w-full"
              />
            </div>

            <Button
              variant="primary"
              appearance="outline"
              size="sm"
              onPress={() => setDrawerOpen(true)}
            >
              Auditoría RF10 ({historial.length})
            </Button>
          </div>
        </div>
      </Card>

      <CicloCarpeta carpeta={carpeta} onUpdated={setCarpeta} />

      {/* Cockpit Master-Detail (2 Columnas) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Columna Izquierda (4/12): Índice Maestro Navegable de las 10 Secciones UNT */}
        <div className="lg:col-span-4">
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-card-border bg-background-gray-primary px-4 py-3.5">
              <h2 className="text-sm font-semibold text-text-primary uppercase">
                Ítems de la plantilla propuesta
              </h2>
              <p className="text-xs text-text-tertiary">
                Seleccione una sección para subir o descargar versiones
              </p>
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-1.5 border-b border-card-border px-4 py-2.5">
              {(
                [
                  { key: "todas", label: `Todas (${secciones.length})` },
                  { key: "observado", label: `Obs (${metricas.observadas})` },
                  { key: "pendiente", label: `Pend (${metricas.pendientes})` },
                  { key: "aprobado", label: `Aprob (${metricas.aprobadas})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltroLista(f.key)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition",
                    filtroLista === f.key
                      ? "bg-brand-500 text-white"
                      : "bg-background-gray-primary text-text-secondary hover:text-text-primary",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista de Secciones */}
            <div className="divide-y divide-card-border">
              {seccionesFiltradas.map((sec) => {
                const isSelected = seccionActiva?.id === sec.id;
                const latestVersion = sec.documentos[0]?.version;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSeccionId(sec.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition",
                      isSelected
                        ? "border-l-4 border-l-brand-500 bg-background-gray-primary"
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
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge color={getEstadoColor(sec.estado)} size="sm">
                          {sec.estado.toUpperCase()}
                        </Badge>
                        {latestVersion && (
                          <Badge color="gray" size="sm">
                            v{latestVersion}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Columna Derecha (8/12): Panel de Gestión Documental de la Sección Seleccionada */}
        <div className="lg:col-span-8">
          {seccionActiva && (
            <Card className="space-y-5">
              <CardHeader className="border-b border-card-border pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="primary" size="sm">
                    SECCIÓN #{seccionActiva.plantilla.orden}
                  </Badge>
                  <Badge
                    color={
                      seccionActiva.plantilla.obligatoria ? "blue" : "gray"
                    }
                    size="sm"
                  >
                    {seccionActiva.plantilla.obligatoria
                      ? "OBLIGATORIA"
                      : "OPCIONAL"}
                  </Badge>
                  <Badge color="gray" size="sm">
                    Formatos: {formatosPermitidos.join(", ").toUpperCase()}
                  </Badge>
                </div>

                <Badge color={getEstadoColor(seccionActiva.estado)} size="md">
                  ESTADO: {seccionActiva.estado.toUpperCase()}
                </Badge>
              </CardHeader>

              <div>
                <CardTitle className="text-xl">
                  {seccionActiva.plantilla.nombre}
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {seccionActiva.plantilla.descripcion}
                </CardDescription>
              </div>

              {/* Alerta de Observación Activa (RF7) */}
              {seccionActiva.observaciones
                .filter((o) => !o.resuelta)
                .map((obs) => (
                  <div
                    key={obs.id}
                    className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-amber-600">
                        Observación Emitida por Dirección de Escuela (
                        {obs.revisor_nombre})
                      </span>
                      <Badge color="warning" size="sm">
                        PENDIENTE DE SUBSANAR
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-text-primary">
                      {obs.texto}
                    </p>
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      Instrucción: Suba una nueva versión corregida en el
                      recuadro inferior para presentar la corrección. Reenvíe el
                      hito para que el Director confirme la subsanación.
                    </p>
                  </div>
                ))}

              {/* Zona Interactiva de Subida y Versionado (RF5) */}
              <div className="rounded-2xl border-2 border-dashed border-brand-500/40 bg-background-gray-primary p-6 text-center">
                <h3 className="text-base font-semibold text-text-primary">
                  {seccionActiva.documentos.length > 0
                    ? `Reemplazar con Nueva Versión (Generará Versión v${
                        seccionActiva.documentos[0].version + 1
                      })`
                    : "Subir Evidencia Inicial (Versión v1)"}
                </h3>
                <p className="mt-1 text-xs text-text-tertiary">
                  Extensiones aceptadas:{" "}
                  <strong>{formatosPermitidos.join(", ").toUpperCase()}</strong>{" "}
                  · Tamaño máximo: 20 MB · Almacenamiento con control de
                  versiones (RF5)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  disabled={carpeta.bloqueada || uploading}
                  className="hidden"
                  accept={formatosPermitidos
                    .map((ext) => `.${ext.trim()}`)
                    .join(",")}
                  onChange={(e) => handleFileChange(seccionActiva, e)}
                />

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    isDisabled={uploading || carpeta.bloqueada}
                    onPress={() => fileInputRef.current?.click()}
                  >
                    {uploading
                      ? "Subiendo y versionando..."
                      : seccionActiva.documentos.length > 0
                        ? `Seleccionar Archivo para Versión v${
                            seccionActiva.documentos[0].version + 1
                          }`
                        : "Seleccionar Archivo desde mi Equipo"}
                  </Button>
                </div>
              </div>

              {/* Tabla de Control de Versiones del Documento (RF5) */}
              <div>
                <h4 className="mb-3 text-xs font-semibold tracking-wider text-text-secondary uppercase">
                  Historial de Versiones en esta Sección (
                  {seccionActiva.documentos.length})
                </h4>

                {seccionActiva.documentos.length === 0 ? (
                  <div className="rounded-xl border border-card-border bg-background-gray-primary p-5 text-center text-sm text-text-tertiary">
                    Aún no se ha subido ningún documento a esta sección.
                  </div>
                ) : (
                  <TableRoot>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Versión</TableHead>
                        <TableHead>Nombre del Documento</TableHead>
                        <TableHead>Tamaño</TableHead>
                        <TableHead>Fecha de Subida</TableHead>
                        <TableHead className="text-right">Descargar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seccionActiva.documentos.map((doc, idx) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <Badge
                              color={idx === 0 ? "primary" : "gray"}
                              size="sm"
                            >
                              v{doc.version}
                              {idx === 0 ? " · ACTUAL" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-text-primary">
                            {doc.nombre}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {doc.tamano_mb} MB
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {new Date(doc.fecha).toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell className="text-right">
                            <DescargaDocumento
                              documentoId={doc.id}
                              nombre={doc.nombre}
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

      {/* Sheet Lateral de Auditoría (RF10) */}
      <SheetOverlay isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-96 max-w-full border-l border-card-border bg-card-surface-area p-5 overflow-y-auto"
        >
          <SheetTitle className="text-lg font-semibold text-text-primary">
            Registro de Auditoría (RF10)
          </SheetTitle>
          <p className="mt-1 text-xs text-text-tertiary">
            Trazabilidad institucional de subidas, reemplazos y dictámenes.
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
