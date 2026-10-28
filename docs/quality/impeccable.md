# Correcciones incrementales de Impeccable

## Entregas

| PR | Corrección | Base inicial |
|---|---|---|
| #6 | Perfil institucional de consulta, datos actuales y rutas antiguas | main |
| #7 | Etiquetas administrativas, feedback y prevención de doble envío | #6 |
| #8 | Plazo semestral visible, hora de Perú y validación en API | #7 |
| #9 | Errores tipados, reintento, cancelación de consultas y conservación de contexto | #8 |
| #10 | Progreso de evaluación, siguiente pendiente y nombre del Director | #9 |
| #11 | Un documento activo, borradores y protección de salida | #10 |
| Incremento 7 | Pulido, fechas coherentes, formatos legibles y verificación del conjunto | #11 |

Los PRs forman una cadena para revisar únicamente el incremento de cada uno. Integrar en orden. Con merge commits, cambiar la base del siguiente a main después de integrar su predecesor; si se usa squash, rebasar el siguiente para evitar que incluya commits ya integrados. Ningún incremento exige migraciones ni dependencias nuevas.

## Cambios de contrato

- `POST /api/admin/semestres` conserva sus campos y exige zona horaria en `fecha_limite`. Rechaza inicio posterior a término y plazo anterior al día de término en America/Lima, antes de crear o desactivar registros.
- Las fechas con hora de la representación de carpeta se devuelven en UTC explícito. Las fechas calendario de inicio y término siguen siendo fechas sin hora. Los valores antiguos sin zona almacenados por el proyecto se interpretan como UTC, igual que en el ciclo existente.
- Cada entrega incorpora `director_nombre`, nullable, conservando `director_id`. No se guarda una copia nueva del nombre en la base.
- Perfil utiliza `/api/auth/me`; no se añaden endpoints de edición, contraseña ni preferencias.

## Verificación reproducible

Usar exclusivamente frontend 3000 y backend 8000. Comprobar primero si están activos y reutilizarlos. No levantar procesos adicionales en otros puertos. Cerrar únicamente los servicios iniciados para la verificación.

Desde la raíz:

```powershell
npm run test:backend
node tests/frontend-values.cjs
node tests/e2e/impeccable.cjs
node tests/e2e/impeccable-visual.cjs
```

Los dos recorridos `impeccable` requieren el frontend principal y sustituyen las respuestas de API por datos ficticios en el navegador. No escriben en una base real. Las capturas se guardan en `.impeccable/review/final/`, excluida de Git; `UI_QA_ARTIFACTS` permite elegir otra carpeta. La verificación incluye 360/768/1440 px, temas claro y oscuro, zoom de contenido al 200%, teclado, movimiento reducido y ausencia de errores de ejecución. No equivale a certificar conformidad WCAG ni a una sesión con lector de pantalla.

Para la inspección por roles y el ciclo completo, si el backend principal está apagado, iniciarlo temporalmente con datos ficticios desde `backend`:

```powershell
.venv/Scripts/python.exe -m uvicorn visual_app:app --app-dir tests --host 127.0.0.1 --port 8000
```

Este servidor utiliza SQLite en memoria y almacenamiento temporal dentro de `backend/tests/.ciclo-*`; no inicia el backend de producción ni utiliza sus registros. Cierra el proceso al terminar y comprueba que se retiró su almacenamiento temporal. No reemplazar un backend que el usuario ya tenga activo.

Desde la raíz, con ese backend ficticio y el frontend principal:

```powershell
$env:CICLO_QA_BACKEND = 'http://127.0.0.1:8000'
$env:CICLO_QA_FRONTEND = 'http://127.0.0.1:3000'
$env:CICLO_QA_ARTIFACTS = "$PWD/.impeccable/review/ciclo-final"
node tests/e2e/ciclo.cjs
```

El recorrido comprueba la marca `fictitious-visual-qa` del backend antes de cualquier escritura y crea un curso ficticio nuevo. Cubre entrega parcial, bloqueo, observación, corrección, reenvío, aprobación parcial, cierre integral sin seguimiento, conservación del historial y bloqueo final.

## Resultado y límites

- La evaluación independiente pasó de 22/40 a 32/40. La segunda evaluación utilizó navegador con registros ficticios y revisión separada del detector; no encontró P0/P1 en las vistas inspeccionadas.
- El pulido posterior corrigió las observaciones menores de esa evaluación: tabla semestral comprimida, nombre/foco del buscador, tamaños documentales con decimales crudos, presentación horaria inconsistente y plurales básicos.
- El detector no reportó hallazgos. Esto no sustituye la inspección visual ni las pruebas de guardado y recuperación.
- TypeScript y los controles estáticos del código nuevo pasan. El lint global conserva ocho errores anteriores en primitivas, hidratación de contextos y el hook de media query, además de siete avisos. No se desactivaron reglas ni se modificaron esas primitivas para ocultarlos.
- El cambio mantiene los plazos y las versiones de entregas existentes; no introduce un editor de hitos ni cambia las reglas de aprobación y subsanación.
