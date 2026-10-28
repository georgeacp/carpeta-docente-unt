export class ApiError extends Error {
  constructor(public readonly status: number | null, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiProblem(error: Error) {
  const status = error instanceof ApiError ? error.status : null;

  if (status === 401) return { title: "Tu sesión ha caducado", message: "Vuelve a iniciar sesión para continuar.", retry: false };

  if (status === 403) return { title: "No tienes acceso", message: "Tu cuenta no tiene permiso para consultar esta información.", retry: false };

  if (status === 404) return { title: "No se encontró el recurso", message: "Comprueba el enlace o vuelve al tablero.", retry: false };

  return { title: "No se pudo cargar la información", message: status ? "El servidor no pudo completar la consulta. Puedes volver a intentarlo." : "Comprueba tu conexión y vuelve a intentarlo.", retry: true };
}
