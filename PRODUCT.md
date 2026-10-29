# Carpeta Docente UNT

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Docente y Director de Escuela tienen igual prioridad en las decisiones de producto, según confirmación del responsable del proyecto.
- El docente prepara la documentación de sus cursos, presenta entregas y atiende observaciones.
- El Director de Escuela revisa las entregas, evalúa sus documentos y emite dictámenes.
- El administrador mantiene cursos, usuarios, semestres y asignaciones docentes.

## Product Purpose

Organizar y revisar la documentación académica de cada curso y semestre mediante una carpeta docente. El éxito del flujo consiste en que el docente pueda preparar y presentar documentación, el Director pueda emitir una decisión fundamentada y ambos puedan consultar lo presentado y lo resuelto.

El alcance confirmado es un prototipo académico para una escuela, con intención de evolucionar a uso real. No constituye normativa oficial de la Universidad Nacional de Trujillo ni acredita una implantación institucional.

## Operating Context

Cada carpeta corresponde a un curso y semestre académico y tiene un único docente responsable. El ciclo contempla hitos de inicio, seguimiento y cierre integral. Una entrega identifica las versiones documentales presentadas para revisión.

La aplicación existente utiliza un frontend Next.js y un backend FastAPI. En desarrollo y verificación se utiliza exclusivamente la instancia principal: frontend en `http://localhost:3000` y backend en `http://localhost:8000`, conforme a `AGENTS.md`. Las pruebas que escriban datos deben utilizar datos ficticios identificables.

## Capabilities and Constraints

Hechos documentados en el repositorio:

- Hay vistas por rol para docente, Director de Escuela y administrador.
- Se conservan versiones documentales, entregas y un historial de acciones.
- Existe una única entrega pendiente por carpeta; su envío bloquea la edición durante la revisión.
- La evaluación de cada documento puede guardarse pendiente; el dictamen conjunto concluye la revisión y exige evaluar todos los documentos y fundamentar cada observación.
- Una aprobación parcial permite continuar la elaboración. Solo la aprobación del cierre integral bloquea definitivamente la carpeta.
- Cargar una nueva versión no equivale a subsanar una observación: la conformidad debe confirmarla el Director en una revisión posterior.
- Las presentaciones tardías están permitidas y se registran como tales.
- El Director puede revisar su propia carpeta; el dictamen deja constancia de la autorrevisión.
- La plantilla y las fechas iniciales son demostrativas. El administrador puede configurar requisitos existentes y fechas por curso y semestre hasta la primera carga exitosa de documentos. Las prórrogas siguen pendientes, según `docs/ciclo-carpeta.md`.
- El perfil institucional consulta los datos actuales de la cuenta y no permite editarlos. Las rutas antiguas de seguridad y preferencias redirigen al perfil; no hay edición de contraseña ni notificaciones reales. Las páginas heredadas de la plantilla visual no deben presentarse como funcionalidades completas sin comprobar su integración.

Las propuestas de ampliación discutidas en el chat son opciones, no compromisos de implementación.

Decisiones abiertas: condiciones para pasar a uso real, despliegue, alcance institucional posterior y requisitos específicos de accesibilidad. No se ha confirmado soporte para varias escuelas.

## Brand Commitments

El nombre existente es Carpeta Docente UNT. Los términos del producto se rigen por `GLOSSARY.md`, especialmente carpeta docente, ítem documental, hito de entrega, entrega, evaluación documental, dictamen, observación y subsanación.

Mantener una comunicación académica clara y evitar afirmaciones de oficialidad que el prototipo no puede sustentar. La autoridad visual existente se encuentra en `DESIGN.md`.

## Evidence on Hand

- `GLOSSARY.md`: vocabulario y límites del prototipo.
- `docs/ciclo-carpeta.md`: comportamiento del ciclo, configuración demostrativa y pendientes conocidos.
- `README.md`: desarrollo local y comandos de verificación.
- `frontend/src/app/(with-layouts)/docente/`, `revisor/` y `admin/`: vistas existentes de los flujos por rol.
- `backend/app/ciclo.py` y `backend/app/routers/`: implementación del ciclo y operaciones disponibles.
- `backend/tests/`: pruebas del ciclo y transporte; su presencia no acredita operación en producción.

La prioridad de usuarios, el alcance como prototipo de una escuela y la intención de evolucionar a uso real fueron confirmados por el responsable del proyecto durante `impeccable init`.

## Product Principles

1. Equilibrar la preparación de documentación del docente y la revisión del Director de Escuela.
2. Conservar la trazabilidad de versiones, presentaciones y decisiones.
3. Diferenciar carga de archivo, entrega formal, evaluación documental y dictamen.
4. Hacer visibles las acciones pendientes, las restricciones y el estado real de cada flujo.
5. Evolucionar hacia uso real sin presentar datos demostrativos ni capacidades pendientes como hechos institucionales.
