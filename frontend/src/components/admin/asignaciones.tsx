"use client";

import { useState } from "react";
import { useI18n } from "@/context/i18n-context";
import { AdminForm } from "./admin-form";
import { useSubmission } from "@/hooks/use-submission";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/tailgrids/core/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { CatalogoAdmin, apiCrearAsignacion } from "@/lib/api";
import { toast } from "sonner";

export function Asignaciones({
  catalogo,
  onUpdated,
}: {
  catalogo: CatalogoAdmin;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const asignacion = useSubmission();

  // Formulario Asignación (RF3 + RF4)
  const [asigDocenteId, setAsigDocenteId] = useState<number | "">(
    catalogo.usuarios.find(
      (u) => u.activo && (u.rol === "docente" || u.rol === "revisor"),
    )?.id ?? "",
  );

  const [asigCursoId, setAsigCursoId] = useState<number | "">(
    catalogo.cursos[0]?.id ?? "",
  );

  const [asigSemestreId, setAsigSemestreId] = useState<number | "">(
    catalogo.semestres.find((s) => s.activo)?.id ??
      catalogo.semestres[0]?.id ??
      "",
  );

  const [asigSeccion, setAsigSeccion] = useState("A");

  const docentes = catalogo.usuarios.filter(
    (u) => u.activo && (u.rol === "docente" || u.rol === "revisor"),
  );

  const handleCrearAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!asigDocenteId || !asigCursoId || !asigSemestreId) return;

    await asignacion.run(async () => {
      await apiCrearAsignacion({
        docente_id: Number(asigDocenteId),
        curso_id: Number(asigCursoId),
        semestre_id: Number(asigSemestreId),
        seccion: asigSeccion,
      });
      toast.success(
        "Carga lectiva asignada. La carpeta docente está disponible.",
      );
      onUpdated();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <Card>
          <CardHeader className="mb-4">
            <div>
              <CardTitle>Nueva Asignación de Carga Lectiva</CardTitle>
              <CardDescription className="text-xs">
                Al guardar, el sistema crea automáticamente la Carpeta Docente y
                sus ítems documentales.
              </CardDescription>
            </div>
          </CardHeader>

          <AdminForm
            id="asignacion"
            state={asignacion}
            onSubmit={handleCrearAsignacion}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="admin-asigDocenteId"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Docente
              </label>
              <select
                id="admin-asigDocenteId"
                aria-describedby="asignacion-feedback"
                value={asigDocenteId}
                onChange={(e) => setAsigDocenteId(Number(e.target.value))}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              >
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-asigCursoId"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Curso / Asignatura
              </label>
              <select
                id="admin-asigCursoId"
                aria-describedby="asignacion-feedback"
                value={asigCursoId}
                onChange={(e) => setAsigCursoId(Number(e.target.value))}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              >
                {catalogo?.cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} — {c.nombre} (Ciclo {c.ciclo}°)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-asigSemestreId"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Semestre Académico
              </label>
              <select
                id="admin-asigSemestreId"
                aria-describedby="asignacion-feedback"
                value={asigSemestreId}
                onChange={(e) => setAsigSemestreId(Number(e.target.value))}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              >
                {catalogo?.semestres.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.activo ? "(Activo)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-asigSeccion"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Sección (Ej. A, B, Única)
              </label>
              <input
                id="admin-asigSeccion"
                aria-describedby="asignacion-feedback"
                type="text"
                value={asigSeccion}
                onChange={(e) => setAsigSeccion(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="min-h-11 w-full"
            >
              Asignar y generar carpeta
            </Button>
          </AdminForm>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <Card>
          <CardHeader className="mb-4">
            <CardTitle>
              Carpetas Generadas por Carga Lectiva (
              {catalogo?.asignaciones.length || 0})
            </CardTitle>
          </CardHeader>

          <TableRoot>
            <TableHeader>
              <TableRow>
                <TableHead>Semestre</TableHead>
                <TableHead>Curso y Sección</TableHead>
                <TableHead>Docente Asignado</TableHead>
                <TableHead className="text-center">
                  Ítems documentales
                </TableHead>
                <TableHead className="text-right">Avance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!catalogo.asignaciones.length && (
                <TableRow>
                  <TableCell colSpan={5}>{t("modules.emptyCatalog")}</TableCell>
                </TableRow>
              )}
              {catalogo?.asignaciones.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Badge color="primary" size="sm">
                      {a.semestre.nombre}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-text-primary">
                      {a.curso.codigo} · {a.curso.nombre}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      Sección {a.seccion} · Ciclo {a.curso.ciclo}°
                    </div>
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {a.docente.nombre}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge color="gray" size="sm">
                      {a.metricas.total_secciones} ítems documentales
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-text-primary">
                    {a.metricas.porcentaje_avance}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      </div>
    </div>
  );
}
