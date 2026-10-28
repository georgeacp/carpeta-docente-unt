"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { useSubmission } from "@/hooks/use-submission";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/tailgrids/core/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import {
  apiCrearAsignacion,
  apiCrearCurso,
  apiCrearSemestre,
  apiCrearUsuario,
  apiFetchCatalogoAdmin,
  CatalogoAdmin,
} from "@/lib/api";
import { cn } from "@/utils/cn";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [catalogo, setCatalogo] = useState<CatalogoAdmin | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const asignacion = useSubmission();
  const curso = useSubmission();
  const usuario = useSubmission();
  const semestre = useSubmission();

  // Formulario Asignación (RF3 + RF4)
  const [asigDocenteId, setAsigDocenteId] = useState<number | "">("");
  const [asigCursoId, setAsigCursoId] = useState<number | "">("");
  const [asigSemestreId, setAsigSemestreId] = useState<number | "">("");
  const [asigSeccion, setAsigSeccion] = useState("A");

  // Formulario Nuevo Curso
  const [curCodigo, setCurCodigo] = useState("");
  const [curNombre, setCurNombre] = useState("");
  const [curCiclo, setCurCiclo] = useState(7);

  // Formulario Nuevo Docente / Usuario
  const [usrNombre, setUsrNombre] = useState("");
  const [usrEmail, setUsrEmail] = useState("");
  const [usrRol, setUsrRol] = useState("docente");

  const [usrCategoria, setUsrCategoria] = useState(
    "Docente Ordinario - Auxiliar TC",
  );

  // Formulario Nuevo Semestre
  const [semNombre, setSemNombre] = useState("2027-I");
  const [semInicio, setSemInicio] = useState("2027-04-01");
  const [semFin, setSemFin] = useState("2027-07-30");
  const [semLimite] = useState("2027-08-05T23:59:00Z");

  const cargarDatos = () => {
    apiFetchCatalogoAdmin()
      .then((data) => {
        setCatalogo(data);
        const docs = data.usuarios.filter((u) => u.rol === "docente");

        if (docs.length > 0 && !asigDocenteId) setAsigDocenteId(docs[0].id);

        if (data.cursos.length > 0 && !asigCursoId)
          setAsigCursoId(data.cursos[0].id);

        if (data.semestres.length > 0 && !asigSemestreId)
          setAsigSemestreId(data.semestres[0].id);
      })
      .catch((err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : "Error al cargar catálogo administrativo",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      cargarDatos();
    });
  };

  const handleCrearCurso = async (e: React.FormEvent) => {
    e.preventDefault();

    await curso.run(async () => {
      await apiCrearCurso({
        codigo: curCodigo,
        nombre: curNombre,
        escuela: "Ingeniería de Sistemas",
        ciclo: Number(curCiclo),
      });
      setCurCodigo("");
      setCurNombre("");
      toast.success("Curso registrado en el catálogo de la escuela.");
      cargarDatos();
    });
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    await usuario.run(async () => {
      await apiCrearUsuario({
        nombre: usrNombre,
        email: usrEmail,
        rol: usrRol,
        escuela: "Ingeniería de Sistemas",
        categoria: usrCategoria,
      });
      setUsrNombre("");
      setUsrEmail("");
      toast.success("Usuario institucional creado correctamente.");
      cargarDatos();
    });
  };

  const handleCrearSemestre = async (e: React.FormEvent) => {
    e.preventDefault();

    await semestre.run(async () => {
      await apiCrearSemestre({
        nombre: semNombre,
        inicio: semInicio,
        fin: semFin,
        fecha_limite: semLimite,
        activo: true,
      });
      toast.success(`Semestre ${semNombre} aperturado exitosamente.`);
      cargarDatos();
    });
  };

  const docentes = catalogo?.usuarios.filter((u) => u.rol === "docente") || [];

  return (
    <div className="space-y-8 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px] text-text-primary">
            Administración académica
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Gestione los cursos, las asignaciones docentes y los semestres
            académicos.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            "Carga lectiva",
            "Cursos y docentes",
            "Semestres",
            "Plantilla de carpeta",
          ].map((label, idx) => (
            <button
              key={label}
              type="button"
              aria-pressed={tabIndex === idx}
              onClick={() => setTabIndex(idx)}
              className={cn(
                "min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                tabIndex === idx
                  ? "bg-brand-100 text-brand-600"
                  : "border border-card-border bg-card-surface-area text-text-secondary hover:text-text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && !catalogo ? (
          <Card className="py-12 text-center">
            <p className="text-sm text-text-tertiary">
              Cargando catálogo administrativo UNT...
            </p>
          </Card>
        ) : (
          <>
            {/* TAB 0: ASIGNACIONES Y GENERACIÓN AUTOMÁTICA DE CARPETAS */}
            {tabIndex === 0 && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <Card>
                    <CardHeader className="mb-4">
                      <div>
                        <CardTitle>Nueva Asignación de Carga Lectiva</CardTitle>
                        <CardDescription className="text-xs">
                          Al guardar, el sistema crea automáticamente la Carpeta
                          Docente y sus 10 ítems documentales.
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <AdminForm id="asignacion" state={asignacion} onSubmit={handleCrearAsignacion} className="space-y-4">
                      <div>
                        <label htmlFor="admin-asigDocenteId" className="mb-1 block text-sm font-medium text-text-secondary">
                          Docente
                        </label>
                        <select id="admin-asigDocenteId"
                          value={asigDocenteId}
                          onChange={(e) =>
                            setAsigDocenteId(Number(e.target.value))
                          }
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
                        <label htmlFor="admin-asigCursoId" className="mb-1 block text-sm font-medium text-text-secondary">
                          Curso / Asignatura
                        </label>
                        <select id="admin-asigCursoId"
                          value={asigCursoId}
                          onChange={(e) =>
                            setAsigCursoId(Number(e.target.value))
                          }
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
                        <label htmlFor="admin-asigSemestreId" className="mb-1 block text-sm font-medium text-text-secondary">
                          Semestre Académico
                        </label>
                        <select id="admin-asigSemestreId"
                          value={asigSemestreId}
                          onChange={(e) =>
                            setAsigSemestreId(Number(e.target.value))
                          }
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
                        <label htmlFor="admin-asigSeccion" className="mb-1 block text-sm font-medium text-text-secondary">
                          Sección (Ej. A, B, Única)
                        </label>
                        <input id="admin-asigSeccion"
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
                        className="w-full"
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
                            Secciones
                          </TableHead>
                          <TableHead className="text-right">Avance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
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
                                {a.metricas.total_secciones} secciones
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
            )}

            {/* TAB 1: CURSOS Y DOCENTES */}
            {tabIndex === 1 && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-5">
                  <Card>
                    <CardHeader className="mb-4">
                      <CardTitle>Registrar Nuevo Curso UNT</CardTitle>
                    </CardHeader>
                    <AdminForm id="curso" state={curso} onSubmit={handleCrearCurso} className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label htmlFor="admin-curCodigo" className="mb-1 block text-sm font-medium text-text-secondary">
                            Código (Ej. ING-601)
                          </label>
                          <input id="admin-curCodigo"
                            type="text"
                            value={curCodigo}
                            onChange={(e) => setCurCodigo(e.target.value)}
                            required
                            className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="admin-curCiclo" className="mb-1 block text-sm font-medium text-text-secondary">
                            Ciclo
                          </label>
                          <input id="admin-curCiclo"
                            type="number"
                            value={curCiclo}
                            onChange={(e) =>
                              setCurCiclo(Number(e.target.value))
                            }
                            required
                            className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="admin-curNombre" className="mb-1 block text-sm font-medium text-text-secondary">
                          Nombre de la Asignatura
                        </label>
                        <input id="admin-curNombre"
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
                        className="w-full"
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

                <div className="space-y-5">
                  <Card>
                    <CardHeader className="mb-4">
                      <CardTitle>
                        Registrar Docente / Revisor (@unitru.edu.pe)
                      </CardTitle>
                    </CardHeader>
                    <AdminForm id="usuario" state={usuario} onSubmit={handleCrearUsuario} className="space-y-3">
                      <div>
                        <label htmlFor="admin-usrNombre" className="mb-1 block text-sm font-medium text-text-secondary">
                          Grado y Apellidos/Nombres
                        </label>
                        <input id="admin-usrNombre"
                          type="text"
                          value={usrNombre}
                          onChange={(e) => setUsrNombre(e.target.value)}
                          required
                          className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label htmlFor="admin-usrEmail" className="mb-1 block text-sm font-medium text-text-secondary">
                            Correo @unitru.edu.pe
                          </label>
                          <input id="admin-usrEmail"
                            type="email"
                            value={usrEmail}
                            onChange={(e) => setUsrEmail(e.target.value)}
                            required
                            className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="admin-usrRol" className="mb-1 block text-sm font-medium text-text-secondary">
                            Rol
                          </label>
                          <select id="admin-usrRol"
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
                        <label htmlFor="admin-usrCategoria" className="mb-1 block text-sm font-medium text-text-secondary">
                          Categoría Docente
                        </label>
                        <input id="admin-usrCategoria"
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
                        className="w-full"
                      >
                        Registrar Usuario
                      </Button>
                    </AdminForm>
                  </Card>

                  <Card>
                    <CardHeader className="mb-3">
                      <CardTitle>
                        Usuarios Institucionales (
                        {catalogo?.usuarios.length || 0})
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
              </div>
            )}

            {/* TAB 2: SEMESTRES ACADÉMICOS (RF2) */}
            {tabIndex === 2 && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <Card>
                    <CardHeader className="mb-4">
                      <CardTitle>Abrir semestre académico</CardTitle>
                    </CardHeader>
                    <AdminForm id="semestre" state={semestre} onSubmit={handleCrearSemestre} className="space-y-4">
                      <div>
                        <label htmlFor="admin-semNombre" className="mb-1 block text-sm font-medium text-text-secondary">
                          Denominación (Ej. 2027-I)
                        </label>
                        <input id="admin-semNombre"
                          type="text"
                          value={semNombre}
                          onChange={(e) => setSemNombre(e.target.value)}
                          required
                          className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-semInicio" className="mb-1 block text-sm font-medium text-text-secondary">
                          Fecha de Inicio
                        </label>
                        <input id="admin-semInicio"
                          type="date"
                          value={semInicio}
                          onChange={(e) => setSemInicio(e.target.value)}
                          required
                          className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-semFin" className="mb-1 block text-sm font-medium text-text-secondary">
                          Fecha de Término
                        </label>
                        <input id="admin-semFin"
                          type="date"
                          value={semFin}
                          onChange={(e) => setSemFin(e.target.value)}
                          required
                          className="min-h-11 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-sm"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full"
                      >
                        Crear y Activar Semestre
                      </Button>
                    </AdminForm>
                  </Card>
                </div>

                <div className="lg:col-span-7">
                  <Card>
                    <CardHeader className="mb-4">
                      <CardTitle>Semestres Registrados</CardTitle>
                    </CardHeader>
                    <TableRoot>
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
                        {catalogo?.semestres.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-semibold text-text-primary">
                              {s.nombre}
                            </TableCell>
                            <TableCell>{s.inicio}</TableCell>
                            <TableCell>{s.fin}</TableCell>
                            <TableCell>
                              {new Date(s.fecha_limite).toLocaleDateString(
                                "es-PE",
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                color={s.activo ? "success" : "gray"}
                                size="sm"
                              >
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
            )}

            {/* TAB 3: PLANTILLA DE 10 SECCIONES PREDEFINIDAS (RF4) */}
            {tabIndex === 3 && (
              <Card>
                <CardHeader className="mb-4">
                  <div>
                    <CardTitle>Plantilla de carpeta docente</CardTitle>
                    <CardDescription className="text-xs">
                      Secciones creadas automáticamente cada vez que se asigna
                      carga lectiva a un docente.
                    </CardDescription>
                  </div>
                </CardHeader>
                <TableRoot>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden</TableHead>
                      <TableHead>Ítem documental</TableHead>
                      <TableHead>Carácter</TableHead>
                      <TableHead>Extensiones Permitidas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogo?.plantillas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-bold text-text-primary">
                          #{p.orden}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-text-primary">
                            {p.nombre}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {p.descripcion}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={p.obligatoria ? "primary" : "gray"}
                            size="sm"
                          >
                            {p.obligatoria ? "OBLIGATORIA" : "OPCIONAL"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-text-secondary">
                          {p.tipos_permitidos.toUpperCase()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableRoot>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
