interface ValidationIssue { loc?: Array<string | number>; msg?: string; type?: string }

export function apiMessage(detail: string | ValidationIssue[] | null | undefined): string {
  if (Array.isArray(detail)) {
    const issues: ValidationIssue[] = detail;

    return issues.map((issue) => {
      const labels = new Map([["inicio", "Fecha de inicio"], ["fin", "Fecha de término"], ["fecha_limite", "Fecha límite"], ["nombre", "Nombre"], ["email", "Correo institucional"], ["codigo", "Código"], ["ciclo", "Ciclo"], ["seccion", "Sección"]]);
      const field = issue.loc?.filter(part => part !== "body").map(part => labels.get(String(part)) || "Campo").join(" · ");

      const message = issue.type === "timezone_aware"
        ? "Indica una fecha con zona horaria."
        : issue.msg?.replace(/^Value error, /, "") || "Revisa este campo.";

      return field ? `${field}: ${message}` : message;
    }).join(" ");
  }

  return detail || "No se pudo completar la solicitud. Vuelve a intentarlo.";
}
