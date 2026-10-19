"use client";

import { SearchIcon } from "@/components/common/header/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/tailgrids/core/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/tailgrids/core/input-group";
import { Progress } from "@/components/tailgrids/core/progress";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { apiFetchCarpetasRevisor, CarpetaSummary, ResumenRevisor } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RevisorDashboardPage() {
  const { usuario } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [resumen, setResumen] = useState<ResumenRevisor | null>(null);
  const [carpetas, setCarpetas] = useState<CarpetaSummary[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetchCarpetasRevisor(filtroEstado)
      .then((data) => {
        if (active) {
          setResumen(data.resumen);
          setCarpetas(data.carpetas);
        }
      })
      .catch((err) => {
        if (active)
          toast.error(
            err instanceof Error ? err.message : "Error al cargar panel de revisor",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filtroEstado]);

  const carpetasFiltradas = carpetas.filter((c) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      c.docente.nombre.toLowerCase().includes(q) ||
      c.curso.nombre.toLowerCase().includes(q) ||
      c.curso.codigo.toLowerCase().includes(q)
    );
  });

  const renderEstadoGlobalBadge = (estado: string) => {
    switch (estado) {
      case "aprobada":
        return (
          <Badge color="success" size="sm">
            100% APROBADA
          </Badge>
        );
      case "observada":
        return (
          <Badge color="warning" size="sm">
            CON OBSERVACIONES
          </Badge>
        );
      case "completa_en_revision":
        return (
          <Badge color="blue" size="sm">
            LISTA PARA APROBAR
          </Badge>
        );
      default:
        return (
          <Badge color="gray" size="sm">
            EN PROGRESO
          </Badge>
        );
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 lg:px-6">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge color="warning" size="sm">
              {t("revisor.stationBadge")}
            </Badge>
            <Badge color="gray" size="sm">
              SEMESTRE 2026-II
            </Badge>
            {usuario && (
              <Badge color="cyan" size="sm">
                {usuario.nombre} · Revisor Autorizado
              </Badge>
            )}
          </div>
          <h1 className="text-[26px] leading-8 font-semibold text-text-primary">
            {t("revisor.title")}
          </h1>
          <p className="text-sm leading-5 text-text-tertiary">
            {t("revisor.desc")}
          </p>
        </div>
      </div>

      <div className="space-y-5 px-2 lg:px-5">
        {/* 4 KPI Cards (RF9) */}
        {resumen && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Badge color="primary" size="sm">
                  TOTAL CARPETAS ASIGNADAS
                </Badge>
              </CardHeader>
              <CardContent className="mt-4 p-0">
                <div className="text-3xl font-bold text-text-primary">
                  {resumen.total_carpetas}
                </div>
              </CardContent>
              <CardFooter className="mt-3 flex items-center justify-between p-0">
                <span className="text-xs text-text-tertiary">
                  Avance promedio escuela: <strong>{resumen.promedio_avance}%</strong>
                </span>
                <Badge color="blue" size="sm">
                  {resumen.promedio_avance}%
                </Badge>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Badge color="success" size="sm">
                  CARPETAS 100% APROBADAS
                </Badge>
              </CardHeader>
              <CardContent className="mt-4 p-0">
                <div className="text-3xl font-bold text-emerald-600">{resumen.aprobadas}</div>
              </CardContent>
              <CardFooter className="mt-3 flex items-center justify-between p-0">
                <span className="text-xs text-text-tertiary">
                  Validadas por Dirección de Escuela
                </span>
                <Badge color="success" size="sm">
                  Conformes
                </Badge>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Badge color="warning" size="sm">
                  CON OBSERVACIONES ACTIVAS
                </Badge>
              </CardHeader>
              <CardContent className="mt-4 p-0">
                <div className="text-3xl font-bold text-amber-600">{resumen.observadas}</div>
              </CardContent>
              <CardFooter className="mt-3 flex items-center justify-between p-0">
                <span className="text-xs text-text-tertiary">
                  Esperando subsanación del docente
                </span>
                <Badge color="warning" size="sm">
                  RF7
                </Badge>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Badge color="blue" size="sm">
                  EN PROGRESO / REVISIÓN
                </Badge>
              </CardHeader>
              <CardContent className="mt-4 p-0">
                <div className="text-3xl font-bold text-blue-600">
                  {resumen.en_progreso + resumen.completas_en_revision}
                </div>
              </CardContent>
              <CardFooter className="mt-3 flex items-center justify-between p-0">
                <span className="text-xs text-text-tertiary">
                  {resumen.vencidas} carpeta(s) fuera de plazo
                </span>
                <Badge color="cyan" size="sm">
                  Activas
                </Badge>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Tabla de Supervisión con Filtros y Buscador */}
        <Card>
          <CardHeader className="mb-6 flex-wrap gap-4">
            <div>
              <CardTitle>Listado de Carpetas Docentes de la Escuela</CardTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { key: "todos", label: t("revisor.filterAll") },
                  { key: "observada", label: t("revisor.filterObserved") },
                  { key: "en_progreso", label: t("revisor.filterInReview") },
                  { key: "aprobada", label: t("revisor.filterApproved") },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFiltroEstado(tab.key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                      filtroEstado === tab.key
                        ? "bg-brand-500 text-white"
                        : "bg-background-gray-primary text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-72">
              <InputGroup className="py-1.5">
                <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
                  <SearchIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("revisor.searchPlaceholder")}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="py-0 pl-2 text-sm"
                />
              </InputGroup>
            </div>
          </CardHeader>

          {loading ? (
            <div className="py-10 text-center text-sm text-text-tertiary">
              Cargando carpetas para dictamen...
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow>
                  <TableHead>Docente Responsable</TableHead>
                  <TableHead>Asignatura / Sección</TableHead>
                  <TableHead>Avance Obligatorio (RF8)</TableHead>
                  <TableHead className="text-center">Aprob. / Entreg. / Obs.</TableHead>
                  <TableHead>Estado Global</TableHead>
                  <TableHead className="text-right">Dictamen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carpetasFiltradas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-semibold text-text-primary">{c.docente.nombre}</div>
                      <div className="text-xs text-text-tertiary">
                        {c.docente.email} · {c.docente.categoria}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge color="primary" size="sm">
                          {c.curso.codigo}
                        </Badge>
                        <span className="font-medium text-text-primary">{c.curso.nombre}</span>
                      </div>
                      <div className="mt-1 text-xs text-text-tertiary">
                        Sección {c.seccion} · Ciclo {c.curso.ciclo}° · Semestre{" "}
                        {c.semestre.nombre}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-48">
                      <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                        <span className="text-text-secondary">
                          {c.metricas.completadas_obligatorias}/{c.metricas.total_obligatorias}{" "}
                          obligatorias
                        </span>
                        <span className="font-semibold text-text-primary">
                          {c.metricas.porcentaje_avance}%
                        </span>
                      </div>
                      <Progress
                        progress={c.metricas.porcentaje_avance}
                        className="max-w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Badge color="success" size="sm">
                          {c.metricas.aprobadas} Apr
                        </Badge>
                        <Badge color="blue" size="sm">
                          {c.metricas.entregadas} Rev
                        </Badge>
                        <Badge
                          color={c.metricas.observadas > 0 ? "warning" : "gray"}
                          size="sm"
                        >
                          {c.metricas.observadas} Obs
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{renderEstadoGlobalBadge(c.metricas.estado_global)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => router.push(`/revisor/carpeta/${c.id}`)}
                      >
                        Revisar Carpeta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </Card>
      </div>
    </div>
  );
}
