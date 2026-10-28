// Academic dates are entered in Peru (UTC-05), independently of the browser zone.
export function academicDeadline(date: string, time: string): string {
  const instant = new Date(`${date}T${time}:00-05:00`);

  if (!date || !time || Number.isNaN(instant.getTime())) {
    throw new Error("Indica una fecha y hora límite válidas.");
  }

  return instant.toISOString();
}

export function validateSemester(start: string, end: string, deadline: string) {
  if (!start || !end || !deadline) throw new Error("Completa las fechas del semestre.");

  if (start > end) throw new Error("La fecha de inicio no puede ser posterior al término.");

  if (deadline < end) throw new Error("La fecha límite no puede ser anterior al término en hora de Perú.");
}

export function formatAcademicDeadline(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
  }).format(new Date(value));
}
