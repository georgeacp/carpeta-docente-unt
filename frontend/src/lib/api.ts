export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "docente" | "revisor" | "admin";
  escuela: string;
  categoria?: string;
  activo?: boolean;
}

export interface MetricasCarpeta {
  total_secciones: number;
  total_obligatorias: number;
  completadas_obligatorias: number;
  aprobadas: number;
  entregadas: number;
  observadas: number;
  pendientes: number;
  porcentaje_avance: number;
  porcentaje_aprobacion: number;
  vencida: boolean;
  estado_global: "aprobada" | "completa_en_revision" | "observada" | "en_progreso" | "vencida";
}

export interface CarpetaSummary {
  id: number;
  asignacion_id: number;
  seccion: string;
  fecha_actualizacion: string | null;
  docente: {
    id: number;
    nombre: string;
    email: string;
    escuela: string;
    categoria: string;
  };
  curso: {
    id: number;
    codigo: string;
    nombre: string;
    escuela: string;
    ciclo: number;
  };
  semestre: {
    id: number;
    nombre: string;
    inicio: string;
    fin: string;
    fecha_limite: string;
    activo: boolean;
  };
  metricas: MetricasCarpeta;
}

export interface DocumentoItem {
  id: number;
  nombre: string;
  tamano_mb: number;
  version: number;
  subido_por: string;
  fecha: string;
}

export interface ObservacionItem {
  id: number;
  texto: string;
  resuelta: boolean;
  revisor_nombre: string;
  fecha: string;
}

export interface SeccionCarpeta {
  id: number;
  estado: "pendiente" | "entregado" | "observado" | "aprobado";
  plantilla: {
    id: number;
    orden: number;
    nombre: string;
    descripcion: string;
    obligatoria: boolean;
    tipos_permitidos: string;
  };
  documentos: DocumentoItem[];
  observaciones: ObservacionItem[];
}

export interface HistorialItem {
  id: number;
  accion: string;
  detalle: string;
  usuario_nombre: string;
  usuario_rol: string;
  fecha: string;
}

export interface CarpetaDetail extends CarpetaSummary {
  secciones: SeccionCarpeta[];
  historial: HistorialItem[];
}

export interface ResumenRevisor {
  total_carpetas: number;
  aprobadas: number;
  completas_en_revision: number;
  observadas: number;
  en_progreso: number;
  vencidas: number;
  promedio_avance: number;
}

export interface CatalogoAdmin {
  semestres: Array<{
    id: number;
    nombre: string;
    inicio: string;
    fin: string;
    fecha_limite: string;
    activo: boolean;
  }>;
  cursos: Array<{
    id: number;
    codigo: string;
    nombre: string;
    escuela: string;
    ciclo: number;
  }>;
  usuarios: Usuario[];
  plantillas: Array<{
    id: number;
    orden: number;
    nombre: string;
    descripcion: string;
    obligatoria: boolean;
    tipos_permitidos: string;
  }>;
  asignaciones: CarpetaSummary[];
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("unt_jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = "Error en la solicitud al servidor.";
    try {
      const errData = await res.json();
      msg = errData.detail || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ access_token: string; usuario: Usuario }>(res);
}

export async function apiDemoLogin(rol: "docente" | "revisor" | "admin") {
  const res = await fetch("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rol }),
  });
  return handleResponse<{ access_token: string; usuario: Usuario }>(res);
}

export async function apiFetchMisCarpetas(): Promise<CarpetaSummary[]> {
  const res = await fetch("/api/carpetas/mis-carpetas", {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<CarpetaSummary[]>(res);
}

export async function apiFetchCarpetaDetalle(id: number): Promise<CarpetaDetail> {
  const res = await fetch(`/api/carpetas/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<CarpetaDetail>(res);
}

export async function apiSubirDocumento(seccionId: number, archivo: File): Promise<CarpetaDetail> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  const res = await fetch(`/api/carpetas/secciones/${seccionId}/documentos`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  return handleResponse<CarpetaDetail>(res);
}

export async function apiFetchCarpetasRevisor(estadoGlobal = "todos"): Promise<{
  resumen: ResumenRevisor;
  carpetas: CarpetaSummary[];
}> {
  const res = await fetch(`/api/revision/carpetas?estado_global=${encodeURIComponent(estadoGlobal)}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ resumen: ResumenRevisor; carpetas: CarpetaSummary[] }>(res);
}

export async function apiDictaminarSeccion(
  seccionId: number,
  estado: "aprobado" | "observado" | "entregado" | "pendiente",
  comentario?: string
): Promise<CarpetaDetail> {
  const res = await fetch(`/api/revision/secciones/${seccionId}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ estado, comentario }),
  });
  return handleResponse<CarpetaDetail>(res);
}

export async function apiFetchCatalogoAdmin(): Promise<CatalogoAdmin> {
  const res = await fetch("/api/admin/catalogo", {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<CatalogoAdmin>(res);
}

export async function apiCrearSemestre(payload: {
  nombre: string;
  inicio: string;
  fin: string;
  fecha_limite: string;
  activo: boolean;
}) {
  const res = await fetch("/api/admin/semestres", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function apiCrearCurso(payload: {
  codigo: string;
  nombre: string;
  escuela: string;
  ciclo: number;
}) {
  const res = await fetch("/api/admin/cursos", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function apiCrearUsuario(payload: {
  nombre: string;
  email: string;
  password?: string;
  rol: string;
  escuela: string;
  categoria: string;
}) {
  const res = await fetch("/api/admin/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function apiCrearAsignacion(payload: {
  docente_id: number;
  curso_id: number;
  semestre_id: number;
  seccion: string;
}) {
  const res = await fetch("/api/admin/asignaciones", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<CarpetaSummary>(res);
}
