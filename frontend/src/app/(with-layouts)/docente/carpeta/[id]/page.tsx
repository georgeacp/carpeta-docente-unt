"use client";

import { RequestError } from "@/components/common/request-error";
import { useRemoteData } from "@/hooks/use-remote-data";
import { ApiError } from "@/lib/api-error";
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
import { formatAcademicDeadline } from "@/lib/academic-dates";
import { formatFileSize } from "@/utils/format-file-size";
import { cn } from "@/utils/cn";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useRef, useState, Suspense } from "react";
import {
  FolderObservations,
  FolderHistory,
} from "@/components/carpetas/folder-record";
import { useI18n } from "@/context/i18n-context";
import { toast } from "sonner";

export default function DocenteCarpetaDetallePage() {
  const params = useParams();
  const carpetaId = Number(params?.id);

  return (
    <Suspense>
      <CarpetaContent key={carpetaId} carpetaId={carpetaId} />
    </Suspense>
  );
}

function CarpetaContent({ carpetaId }: { carpetaId: number }) {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useI18n();

  const apartado = [
    "documentacion",
    "entregas",
    "observaciones",
    "historial",
  ].includes(search.get("vista") ?? "")
    ? search.get("vista")
    : "documentacion";

  const setApartado = (vista: string) => {
    const next = new URLSearchParams(search.toString());
    next.set("vista", vista);
    window.history.pushState(null, "", `?${next}`);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(
    (signal: AbortSignal) => {
      if (!Number.isInteger(carpetaId) || carpetaId <= 0)
        return Promise.reject(new ApiError(404, "Carpeta no encontrada."));

      return apiFetchCarpetaDetalle(carpetaId, signal);
    },
    [carpetaId],
  );

  const {
    data: carpeta,
    setData: setCarpeta,
    error,
    loading,
    reload,
  } = useRemoteData<CarpetaDetail>(load);

  const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(
    null,
  );

  const [filtroLista, setFiltroLista] = useState<
    "todas" | "observado" | "pendiente" | "aprobado"
  >("todas");

  const [uploading, setUploading] = useState(false);

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

  if (loading && !carpeta) {
    return (
      <div className="px-4 py-7 sm:px-7 lg:px-10">
        <Card className="py-12 text-center">
          <p className="text-sm text-text-tertiary">
            Cargando documentos del curso…
          </p>
        </Card>
      </div>
    );
  }

  if (!carpeta) {
    return (
      <div className="px-4 py-7 sm:px-7 lg:px-10">
        <RequestError
          error={error || new Error("Sin respuesta")}
          onRetry={reload}
          backHref="/docente"
        />
      </div>
    );
  }

  const { curso, semestre, metricas, secciones, historial } = carpeta;

  const seccionActiva =
    secciones.find((s) => s.id === selectedSeccionId) ||
    secciones.find((s) => s.estado === "observado") ||
    secciones[0];

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
    <div className="space-y-6 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      {error && (
        <RequestError
          error={error}
          onRetry={reload}
          stale
          pending={loading}
          backHref="/docente"
        />
      )}
      <Button appearance="outline" isDisabled={loading} onPress={reload}>
        {loading ? "Consultando…" : "Actualizar carpeta"}
      </Button>
      {/* Barra Superior de la Carpeta con KPI Compacto y Botón Auditoría */}
      <div className="border-b border-card-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                appearance="outline"
                size="xs"
                className="min-h-11"
                onPress={() => router.push("/docente")}
              >
                Volver a mis carpetas
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
                  Documentos obligatorios
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
              onPress={() => setApartado("historial")}
            >
              Ver historial ({historial.length})
            </Button>
          </div>
        </div>
      </div>

      <nav aria-label={t("modules.folderNav")} className="flex flex-wrap gap-2">
        {["documentacion", "entregas", "observaciones", "historial"].map(
          (vista) => (
            <Button
              key={vista}
              appearance="outline"
              aria-current={apartado === vista ? "page" : undefined}
              className={
                apartado === vista ? "bg-brand-100 text-brand-600" : undefined
              }
              onPress={() => setApartado(vista)}
            >
              {t(`modules.${vista}`)}
            </Button>
          ),
        )}
      </nav>
      {apartado === "entregas" && (
        <CicloCarpeta carpeta={carpeta} onUpdated={setCarpeta} />
      )}
      {apartado === "observaciones" && <FolderObservations carpeta={carpeta} />}
      {apartado === "historial" && <FolderHistory carpeta={carpeta} />}

      {/* Cockpit Master-Detail (2 Columnas) */}
      {apartado === "documentacion" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Columna Izquierda (4/12): Índice Maestro Navegable de las 10 Secciones UNT */}
          <div className="lg:col-span-4">
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-card-border bg-background-gray-primary px-4 py-3.5">
                <h2 className="text-base font-semibold text-text-primary">
                  Documentos del curso
                </h2>
                <p className="text-xs text-text-tertiary">
                  Seleccione un ítem para consultar sus documentos
                </p>
              </div>

              {/* Filtros rápidos */}
              <div className="flex flex-wrap gap-1.5 border-b border-card-border px-4 py-2.5">
                {(
                  [
                    { key: "todas", label: `Todas (${secciones.length})` },
                    {
                      key: "observado",
                      label: `Observados (${metricas.observadas})`,
                    },
                    {
                      key: "pendiente",
                      label: `Pendientes (${metricas.pendientes})`,
                    },
                    {
                      key: "aprobado",
                      label: `Aprobados (${metricas.aprobadas})`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    aria-pressed={filtroLista === f.key}
                    onClick={() => setFiltroLista(f.key)}
                    className={cn(
                      "min-h-10 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                      filtroLista === f.key
                        ? "bg-brand-100 text-brand-600"
                        : "bg-background-gray-primary text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Lista de Secciones */}
              <div className="max-h-64 divide-y divide-card-border overflow-y-auto lg:max-h-none">
                {seccionesFiltradas.map((sec) => {
                  const isSelected = seccionActiva?.id === sec.id;
                  const latestVersion = sec.documentos[0]?.version;

                  return (
                    <button
                      key={sec.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSeccionId(sec.id)}
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
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge color={getEstadoColor(sec.estado)} size="sm">
                            {sec.estado === "entregado"
                              ? t("modules.uploaded")
                              : sec.estado.charAt(0).toUpperCase() +
                                sec.estado.slice(1)}
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
                  <span className="text-sm text-text-secondary">
                    {seccionActiva.plantilla.obligatoria
                      ? "Documento obligatorio"
                      : "Documento opcional"}
                  </span>
                  <Badge color={getEstadoColor(seccionActiva.estado)} size="sm">
                    {seccionActiva.estado === "entregado"
                      ? t("modules.uploaded")
                      : seccionActiva.estado.charAt(0).toUpperCase() +
                        seccionActiva.estado.slice(1)}
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
                      className="rounded-xl bg-badge-warning-background p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-badge-warning-text">
                          Observación de {obs.revisor_nombre}
                        </span>
                        <Badge color="warning" size="sm">
                          Pendiente
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm text-text-primary">
                        {obs.texto}
                      </p>
                      <p className="mt-2 text-xs font-medium text-badge-warning-text">
                        Cargue la versión corregida y reenvíe la entrega para
                        que el Director confirme la subsanación.
                      </p>
                    </div>
                  ))}

                {/* Zona Interactiva de Subida y Versionado (RF5) */}
                <div className="rounded-xl border border-dashed border-input-border bg-background-gray-primary p-6 text-center">
                  <h3 className="text-base font-semibold text-text-primary">
                    {seccionActiva.documentos.length > 0
                      ? `Subir versión ${seccionActiva.documentos[0].version + 1}`
                      : "Subir primer documento"}
                  </h3>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Extensiones aceptadas:{" "}
                    <strong>
                      {formatosPermitidos.join(", ").toUpperCase()}
                    </strong>{" "}
                    · Máximo 20 MB. Las versiones anteriores se conservan.
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
                        ? "Subiendo documento…"
                        : seccionActiva.documentos.length > 0
                          ? `Seleccionar archivo (v${seccionActiva.documentos[0].version + 1})`
                          : "Seleccionar archivo"}
                    </Button>
                  </div>
                </div>

                {/* Tabla de Control de Versiones del Documento (RF5) */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-text-secondary">
                    Versiones del documento ({seccionActiva.documentos.length})
                  </h4>

                  {seccionActiva.documentos.length === 0 ? (
                    <div className="rounded-xl border border-card-border bg-background-gray-primary p-5 text-center text-sm text-text-tertiary">
                      Aún no se ha subido ningún documento a este ítem
                      documental.
                    </div>
                  ) : (
                    <TableRoot>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Versión</TableHead>
                          <TableHead>Nombre del Documento</TableHead>
                          <TableHead>Tamaño</TableHead>
                          <TableHead>Fecha de carga</TableHead>
                          <TableHead className="text-right">
                            Descargar
                          </TableHead>
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
                              {formatFileSize(doc.tamano_mb)}
                            </TableCell>
                            <TableCell className="text-text-secondary">
                              {formatAcademicDeadline(doc.fecha) + " (Perú)"}
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
      )}
    </div>
  );
}
