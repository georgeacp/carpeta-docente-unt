"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { apiFetchMisCarpetas, CarpetaSummary } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DocenteDashboardPage() {
  const { usuario } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [carpetas, setCarpetas] = useState<CarpetaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetchMisCarpetas()
      .then((data) => {
        if (active) setCarpetas(data);
      })
      .catch((err) => {
        if (active) toast.error(err instanceof Error ? err.message : "Error al cargar carpetas");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [usuario]);

  const totalObservadas = carpetas.reduce((acc, c) => acc + c.metricas.observadas, 0);
  const totalAprobadas = carpetas.reduce((acc, c) => acc + c.metricas.aprobadas, 0);
  const totalEntregadas = carpetas.reduce((acc, c) => acc + c.metricas.entregadas, 0);
  const promedioAvance =
    carpetas.length > 0
      ? Math.round(
        carpetas.reduce((acc, c) => acc + c.metricas.porcentaje_avance, 0) / carpetas.length,
      )
      : 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 lg:px-6">
        <div>
          <h1 className="text-[26px] leading-8 font-semibold text-text-primary">
            {t("docente.title")}
          </h1>
          <p className="text-sm leading-5 text-text-tertiary">
            {t("docente.desc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="gray" size="sm">
            SEMESTRE 2026-II
          </Badge>
        </div>
      </div>

      {/* Alerta de Observaciones Pendientes si existen */}
      {totalObservadas > 0 && (
        <div className="mx-2 lg:mx-5 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {t("docente.alertObs", { count: totalObservadas })}
            </span>
            <Badge color="warning" size="sm">
              {t("docente.actionRequired")}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {t("docente.alertHint")}
          </p>
        </div>
      )}

      <div className="space-y-5 px-2 lg:px-5">
        {/* 4 KPI Overview Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Badge color="primary" size="sm">
                {t("docente.kpiProgress")}
              </Badge>
            </CardHeader>
            <CardContent className="mt-4 p-0">
              <div className="text-3xl font-bold text-text-primary">{promedioAvance}%</div>
              <Progress progress={promedioAvance} className="mt-3 max-w-full" />
            </CardContent>
            <CardFooter className="mt-3 flex items-center justify-between p-0">
              <span className="text-xs text-text-tertiary">{t("docente.kpiRequired")}</span>
              <Badge color="blue" size="sm">
                {t("docente.kpiTarget")}
              </Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Badge color="blue" size="sm">
                {t("docente.kpiFolders")}
              </Badge>
            </CardHeader>
            <CardContent className="mt-4 p-0">
              <div className="text-3xl font-bold text-text-primary">{carpetas.length}</div>
            </CardContent>
            <CardFooter className="mt-3 flex items-center justify-between p-0">
              <span className="text-xs text-text-tertiary">{t("docente.kpiTeachingLoad")}</span>
              <Badge color="gray" size="sm">
                2026-II
              </Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Badge color="success" size="sm">
                {t("docente.kpiApproved")}
              </Badge>
            </CardHeader>
            <CardContent className="mt-4 p-0">
              <div className="text-3xl font-bold text-emerald-600">{totalAprobadas}</div>
            </CardContent>
            <CardFooter className="mt-3 flex items-center justify-between p-0">
              <span className="text-xs text-text-tertiary">
                {t("docente.kpiInReview", { count: totalEntregadas })}
              </span>
              <Badge color="success" size="sm">
                {t("docente.kpiValidated")}
              </Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Badge color={totalObservadas > 0 ? "warning" : "gray"} size="sm">
                {t("docente.kpiObs")}
              </Badge>
            </CardHeader>
            <CardContent className="mt-4 p-0">
              <div
                className={`text-3xl font-bold ${totalObservadas > 0 ? "text-amber-600" : "text-text-primary"
                  }`}
              >
                {totalObservadas}
              </div>
            </CardContent>
            <CardFooter className="mt-3 flex items-center justify-between p-0">
              <span className="text-xs text-text-tertiary">
                {totalObservadas > 0
                  ? t("docente.kpiNewVersion")
                  : t("docente.kpiNoObs")}
              </span>
              <Badge color={totalObservadas > 0 ? "warning" : "success"} size="sm">
                {totalObservadas > 0 ? t("docente.kpiAlert") : t("docente.kpiUpToDate")}
              </Badge>
            </CardFooter>
          </Card>
        </div>

        {/* Course Folder Cards Grid */}
        {loading ? (
          <Card className="py-12 text-center">
            <p className="text-sm text-text-tertiary">
              {t("docente.syncing")}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {carpetas.map((c) => {
              const { metricas, curso, semestre } = c;
              const hasObs = metricas.observadas > 0;

              return (
                <Card
                  key={c.id}
                  className={
                    hasObs ? "border-amber-500/60 ring-1 ring-amber-500/20" : undefined
                  }
                >
                  <CardHeader className="border-b border-card-border pb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color="primary" size="sm">
                          {curso.codigo}
                        </Badge>
                        <Badge color="gray" size="sm">
                          {t("docente.section")} {c.seccion} · {t("docente.cycle")} {curso.ciclo}°
                        </Badge>
                        <Badge color="cyan" size="sm">
                          {semestre.nombre}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{curso.nombre}</CardTitle>
                      <CardDescription className="text-xs">
                        {t("docente.teacherLabel")} <strong>{c.docente.nombre}</strong> ({c.docente.email})
                      </CardDescription>
                    </div>

                    {hasObs ? (
                      <Badge color="warning" size="md">
                        {t("docente.obsBadge", { count: metricas.observadas })}
                      </Badge>
                    ) : metricas.porcentaje_aprobacion === 100 ? (
                      <Badge color="success" size="md">
                        {t("docente.approvedBadge")}
                      </Badge>
                    ) : (
                      <Badge color="blue" size="md">
                        {t("docente.inProgressBadge")}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 px-0 pt-4 pb-2">
                    {/* Barra de Progreso RF8 */}
                    <div className="rounded-xl border border-card-border bg-background-gray-primary p-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span className="text-text-secondary uppercase">
                          {t("docente.compliance")}
                        </span>
                        <span className="text-text-primary">
                          {metricas.completadas_obligatorias} de {metricas.total_obligatorias} (
                          {metricas.porcentaje_avance}%)
                        </span>
                      </div>
                      <Progress
                        progress={metricas.porcentaje_avance}
                        className="max-w-full"
                        barColor={
                          hasObs
                            ? "#D97706"
                            : metricas.porcentaje_avance === 100
                              ? "#059669"
                              : undefined
                        }
                      />
                    </div>

                    {/* Matriz de 4 estados */}
                    <div className="grid grid-cols-4 gap-2.5 text-center">
                      <div className="rounded-xl border border-card-border bg-background-gray-primary p-3">
                        <div className="text-lg font-bold text-emerald-600">
                          {metricas.aprobadas}
                        </div>
                        <div className="text-[11px] font-medium text-text-tertiary">{t("docente.approved")}</div>
                      </div>
                      <div className="rounded-xl border border-card-border bg-background-gray-primary p-3">
                        <div className="text-lg font-bold text-blue-600">
                          {metricas.entregadas}
                        </div>
                        <div className="text-[11px] font-medium text-text-tertiary">{t("docente.delivered")}</div>
                      </div>
                      <div className="rounded-xl border border-card-border bg-background-gray-primary p-3">
                        <div className="text-lg font-bold text-amber-600">
                          {metricas.observadas}
                        </div>
                        <div className="text-[11px] font-medium text-text-tertiary">{t("docente.observed")}</div>
                      </div>
                      <div className="rounded-xl border border-card-border bg-background-gray-primary p-3">
                        <div className="text-lg font-bold text-text-secondary">
                          {metricas.pendientes}
                        </div>
                        <div className="text-[11px] font-medium text-text-tertiary">{t("docente.pending")}</div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-0 pt-4 pb-0">
                    <span className="text-xs text-text-tertiary">
                      {t("docente.structure")}
                    </span>
                    <Button
                      variant={hasObs ? "danger" : "primary"}
                      size="md"
                      onPress={() => router.push(`/docente/carpeta/${c.id}`)}
                    >
                      {hasObs
                        ? t("docente.btnResolve")
                        : t("docente.btnOpen")}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
