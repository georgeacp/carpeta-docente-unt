"use client";

import { useState } from "react";
import { useI18n } from "@/context/i18n-context";
import { AdminForm } from "./admin-form";
import { useSubmission } from "@/hooks/use-submission";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { CatalogoAdmin, apiCrearSemestre } from "@/lib/api";
import { toast } from "sonner";
import {
  academicDeadline,
  formatAcademicDeadline,
  validateSemester,
} from "@/lib/academic-dates";

export function Semestres({
  catalogo,
  onUpdated,
}: {
  catalogo: CatalogoAdmin;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const semestre = useSubmission();
  // Formulario Nuevo Semestre
  const [semNombre, setSemNombre] = useState("2027-I");
  const [semInicio, setSemInicio] = useState("2027-04-01");
  const [semFin, setSemFin] = useState("2027-07-30");
  const [semLimiteFecha, setSemLimiteFecha] = useState("");
  const [semLimiteHora, setSemLimiteHora] = useState("23:59");
  const semLimite = semLimiteFecha || semFin;

  const handleCrearSemestre = async (e: React.FormEvent) => {
    e.preventDefault();

    await semestre.run(async () => {
      validateSemester(semInicio, semFin, semLimite);
      await apiCrearSemestre({
        nombre: semNombre,
        inicio: semInicio,
        fin: semFin,
        fecha_limite: academicDeadline(semLimite, semLimiteHora),
        activo: true,
      });
      toast.success(`Semestre ${semNombre} aperturado exitosamente.`);
      onUpdated();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-12">
      <div className="2xl:col-span-5">
        <Card>
          <CardHeader className="mb-4">
            <CardTitle>Abrir semestre académico</CardTitle>
          </CardHeader>
          <AdminForm
            id="semestre"
            state={semestre}
            onSubmit={handleCrearSemestre}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="admin-semNombre"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Denominación (Ej. 2027-I)
              </label>
              <input
                id="admin-semNombre"
                aria-describedby="semestre-feedback"
                type="text"
                value={semNombre}
                onChange={(e) => setSemNombre(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="admin-semInicio"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Fecha de Inicio
              </label>
              <input
                id="admin-semInicio"
                aria-describedby="semestre-feedback"
                type="date"
                value={semInicio}
                onChange={(e) => setSemInicio(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="admin-semFin"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Fecha de Término
              </label>
              <input
                id="admin-semFin"
                aria-describedby="semestre-feedback"
                type="date"
                value={semFin}
                min={semInicio}
                onChange={(e) => setSemFin(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="semester-deadline-date"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Fecha límite de cierre (hora de Perú)
              </label>
              <input
                id="semester-deadline-date"
                type="date"
                required
                min={semFin}
                value={semLimite}
                onChange={(event) => setSemLimiteFecha(event.target.value)}
                aria-describedby="semester-deadline-help semestre-feedback"
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500"
              />
            </div>
            <div>
              <label
                htmlFor="semester-deadline-time"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Hora límite (hora de Perú)
              </label>
              <input
                id="semester-deadline-time"
                type="time"
                required
                value={semLimiteHora}
                onChange={(event) => setSemLimiteHora(event.target.value)}
                aria-describedby="semester-deadline-help semestre-feedback"
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500"
              />
            </div>
            <p
              id="semester-deadline-help"
              className="text-sm text-text-secondary"
            >
              America/Lima (UTC−05). Se sugiere el día de término a las 23:59;
              puedes cambiarlo.
            </p>
            <div
              role="status"
              className="space-y-2 text-sm text-text-secondary"
            >
              <p>
                Plazo de cierre:{" "}
                {semLimite && semLimiteHora
                  ? formatAcademicDeadline(
                      academicDeadline(semLimite, semLimiteHora),
                    )
                  : "Completa fecha y hora"}{" "}
                (hora de Perú).
              </p>
              <p>
                Al activar este semestre se desactivará el semestre vigente.
              </p>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="min-h-11 w-full"
            >
              Crear y Activar Semestre
            </Button>
          </AdminForm>
        </Card>
      </div>

      <div className="2xl:col-span-7">
        <Card>
          <CardHeader className="mb-4">
            <CardTitle>Semestres registrados</CardTitle>
          </CardHeader>
          <TableRoot className="whitespace-nowrap">
            <TableHeader>
              <TableRow>
                <TableHead>Semestre</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!catalogo.semestres.length && (
                <TableRow>
                  <TableCell colSpan={5}>{t("modules.emptyCatalog")}</TableCell>
                </TableRow>
              )}
              {catalogo?.semestres.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold text-text-primary">
                    {s.nombre}
                  </TableCell>
                  <TableCell>{s.inicio}</TableCell>
                  <TableCell>{s.fin}</TableCell>
                  <TableCell>
                    {formatAcademicDeadline(s.fecha_limite) + " (Perú)"}
                  </TableCell>
                  <TableCell>
                    <Badge color={s.activo ? "success" : "gray"} size="sm">
                      {s.activo ? "VIGENTE" : "CERRADO"}
                    </Badge>
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
