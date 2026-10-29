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
import { CatalogoAdmin, apiCrearUsuario } from "@/lib/api";
import { toast } from "sonner";

export function Usuarios({
  catalogo,
  onUpdated,
}: {
  catalogo: CatalogoAdmin;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const usuario = useSubmission();
  const { usuario: cuenta } = useAuth();
  // Formulario Nuevo Docente / Usuario
  const [usrNombre, setUsrNombre] = useState("");
  const [usrEmail, setUsrEmail] = useState("");
  const [usrRol, setUsrRol] = useState("docente");

  const [usrCategoria, setUsrCategoria] = useState(
    "Docente Ordinario - Auxiliar TC",
  );

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    await usuario.run(async () => {
      await apiCrearUsuario({
        nombre: usrNombre,
        email: usrEmail,
        rol: usrRol,
        escuela: cuenta?.escuela ?? "Ingeniería de Sistemas",
        categoria: usrCategoria,
      });
      setUsrNombre("");
      setUsrEmail("");
      toast.success("Usuario institucional creado correctamente.");
      onUpdated();
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="mb-4">
          <CardTitle>Registrar Docente / Revisor (@unitru.edu.pe)</CardTitle>
        </CardHeader>
        <AdminForm
          id="usuario"
          state={usuario}
          onSubmit={handleCrearUsuario}
          className="space-y-3"
        >
          <div>
            <label
              htmlFor="admin-usrNombre"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Grado y Apellidos/Nombres
            </label>
            <input
              id="admin-usrNombre"
              aria-describedby="usuario-feedback"
              type="text"
              value={usrNombre}
              onChange={(e) => setUsrNombre(e.target.value)}
              required
              className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label
                htmlFor="admin-usrEmail"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Correo @unitru.edu.pe
              </label>
              <input
                id="admin-usrEmail"
                aria-describedby="usuario-feedback"
                type="email"
                value={usrEmail}
                onChange={(e) => setUsrEmail(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="admin-usrRol"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Rol
              </label>
              <select
                id="admin-usrRol"
                aria-describedby="usuario-feedback"
                value={usrRol}
                onChange={(e) => setUsrRol(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
              >
                <option value="docente">Docente</option>
                <option value="revisor">Revisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="admin-usrCategoria"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Categoría Docente
            </label>
            <input
              id="admin-usrCategoria"
              aria-describedby="usuario-feedback"
              type="text"
              value={usrCategoria}
              onChange={(e) => setUsrCategoria(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="min-h-11 w-full"
          >
            Registrar Usuario
          </Button>
        </AdminForm>
      </Card>

      <Card>
        <CardHeader className="mb-3">
          <CardTitle>
            Usuarios Institucionales ({catalogo?.usuarios.length || 0})
          </CardTitle>
        </CardHeader>
        <TableRoot>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!catalogo.usuarios.length && (
              <TableRow>
                <TableCell colSpan={3}>{t("modules.emptyCatalog")}</TableCell>
              </TableRow>
            )}
            {catalogo?.usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-text-primary">
                  {u.nombre}
                </TableCell>
                <TableCell className="text-xs text-text-secondary">
                  {u.email}
                </TableCell>
                <TableCell>
                  <Badge color="gray" size="sm">
                    {u.rol.toUpperCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      </Card>
    </div>
  );
}
