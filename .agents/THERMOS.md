# Thermos en Carpeta Docente

Las tres skills de [Thermos](https://github.com/cursor/plugins/tree/main/thermos) están instaladas en `.agents/skills/`, con alcance de proyecto y adaptación para Codex. Son instrucciones de revisión, no un programa que se ejecuta con npm.

## Cómo usarlo

En el chat de este proyecto escribe, por ejemplo:

```text
Usa $thermos para revisar mis cambios sin commit. Entrega los hallazgos por prioridad, sin modificar archivos.
```

```text
Usa $thermos para revisar mi rama contra origin/main.
```

Para una sola revisión:

```text
Usa $thermo-nuclear-review para buscar errores, regresiones y problemas de seguridad en mis cambios locales.
```

```text
Usa $thermo-nuclear-code-quality-review para revisar la mantenibilidad y estructura de mis cambios locales.
```

`thermos` combina ambas revisiones, usa dos subagentes en paralelo cuando están disponibles y reúne los hallazgos sin duplicados. Si no hay delegación disponible, ejecuta las dos pasadas de forma secuencial y lo indica. Las skills individuales ejecutan solo su propia rúbrica.

Las skills estarán disponibles en el siguiente turno. Si no aparecen en el selector, reinicia Codex. Se conserva la activación explícita del original mediante `policy.allow_implicit_invocation: false`: invócalas con `$nombre-de-skill`.

## Configuración

- Contexto compartido: `.agents/skills/thermos/references/project-context.md`.
- Sin un alcance explícito, se revisan los cambios locales; si no hay cambios locales, se compara la rama con la base verificada. Si no hay diff, se informa sin ampliar la auditoría.
- Los cambios locales incluyen archivos nuevos relevantes que aún no están versionados.
- Informe en español, con prioridad, ubicación, evidencia y propuesta de corrección.
- Se respetan las convenciones existentes del frontend y los comandos de validación del proyecto.
- La revisión devuelve un informe. Para aplicar correcciones, pídelo expresamente después o inclúyelo en tu solicitud.

No requiere conectar una cuenta de GitHub, tokens, un servidor MCP adicional ni instalar paquetes npm/Python. Consultar conversaciones de un PR privado sí requiere acceso a ese PR; si no está disponible, la revisión local continúa y se indica la limitación.

`/add-plugin thermos` es el comando del plugin original para Cursor. Esta instalación usa las skills locales de Codex y no registra ese comando de Cursor.

## Origen y actualización

- Repositorio: `cursor/plugins`, carpeta `thermos`.
- Versión del manifiesto de origen: `1.0.0`.
- Revisión fijada: `190d28736eff128ec94f502a22c7fe0c4b56cd37`.
- Fecha de instalación: 20 de octubre de 2026.
- Licencia MIT; cada skill conserva una copia de `LICENSE`.

Las rúbricas originales se conservan, con una sección de integración local. La skill orquestadora sustituye las llamadas `Task` de Cursor por las herramientas de subagentes disponibles en Codex. Se reemplaza `disable-model-invocation` por su configuración de invocación en `agents/openai.yaml`.

Para actualizar, pide: `Actualiza las skills de Thermos desde cursor/plugins conservando la adaptación de Codex y el contexto de este proyecto`. Compara primero la revisión de origen con la nueva; reemplazar las carpetas sin esa comparación eliminaría la configuración local.

Versiona las tres carpetas de skills y esta guía para compartir la instalación con otras personas que clonen el proyecto.
