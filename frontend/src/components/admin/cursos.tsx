"use client";

import { useState } from "react";
import { useI18n } from "@/context/i18n-context";
import { useAuth } from "@/context/auth-context";
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
import { CatalogoAdmin, apiCrearCurso } from "@/lib/api";
import { toast } from "sonner";

export function Cursos({
  catalogo,
  onUpdated,
}: {
  catalogo: CatalogoAdmin;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const curso = useSubmission();
  const { usuario: cuenta } = useAuth();
  // Formulario Nuevo Curso
  const [curCodigo, setCurCodigo] = useState("");
  const [curNombre, setCurNombre] = useState("");
  const [curCiclo, setCurCiclo] = useState(7);

  const handleCrearCurso = async (e: React.FormEvent) => {
    e.preventDefault();

    await curso.run(async () => {
      await apiCrearCurso({
        codigo: curCodigo,
        nombre: curNombre,
        escuela: cuenta?.escuela ?? "Ingeniería de Sistemas",
        ciclo: Number(curCiclo),
      });
      setCurCodigo("");
      setCurNombre("");
      toast.success("Curso registrado en el catálogo de la escuela.");
      onUpdated();
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="mb-4">
          <CardTitle>Registrar Nuevo Curso UNT</CardTitle>
        </CardHeader>
        <AdminForm
          id="curso"
          state={curso}
          onSubmit={handleCrearCurso}
          className="space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label
                htmlFor="admin-curCodigo"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Código (Ej. ING-601)
              </label>
              <input
                id="admin-curCodigo"
                aria-describedby="curso-feedback"
                type="text"
                value={curCodigo}
                onChange={(e) => setCurCodigo(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="admin-curCiclo"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Ciclo
              </label>
              <input
                id="admin-curCiclo"
                aria-describedby="curso-feedback"
                type="number"
                value={curCiclo}
                onChange={(e) => setCurCiclo(Number(e.target.value))}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="admin-curNombre"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Nombre de la Asignatura
            </label>
            <input
              id="admin-curNombre"
              aria-describedby="curso-feedback"
              type="text"
              value={curNombre}
              onChange={(e) => setCurNombre(e.target.value)}
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
            Guardar Curso
          </Button>
        </AdminForm>
      </Card>

      <Card>
        <CardHeader className="mb-3">
          <CardTitle>
            Catálogo de Cursos ({catalogo?.cursos.length || 0})
          </CardTitle>
        </CardHeader>
        <TableRoot>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Asignatura</TableHead>
              <TableHead>Ciclo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!catalogo.cursos.length && (
              <TableRow>
                <TableCell colSpan={3}>{t("modules.emptyCatalog")}</TableCell>
              </TableRow>
            )}
            {catalogo?.cursos.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Badge color="primary" size="sm">
                    {c.codigo}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-text-primary">
                  {c.nombre}
                </TableCell>
                <TableCell>{c.ciclo}°</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      </Card>
    </div>
  );
}
