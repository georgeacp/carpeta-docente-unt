# Issue tracker: GitHub

Las tareas y especificaciones de este proyecto viven en GitHub Issues:
https://github.com/georgeacp/carpeta-docente-unt/issues

Repositorio: `georgeacp/carpeta-docente-unt`. Verificar el destino antes de
cualquier operación; `git remote -v` permite comprobarlo.

## Operaciones

Usar las herramientas de GitHub conectadas y autorizadas para leer, crear,
comentar, clasificar y cerrar issues. Si GitHub CLI (`gh`) está instalado y
autenticado, también puede utilizarse con este repositorio como destino explícito.
Si falta acceso, solicitar la reconexión; no presentar operaciones pendientes como
realizadas ni cambiar a un tracker local sin que el usuario lo elija.

- Crear: título y cuerpo completos; respetar los saltos de línea.
- Leer: número, título, cuerpo, estado, etiquetas y comentarios pertinentes.
- Listar: filtrar por estado y etiquetas; contemplar la paginación.
- Actualizar: conservar el contenido y las etiquetas ajenos al cambio solicitado.
- Comentar o cerrar: hacerlo únicamente cuando la tarea actual lo autorice.
- Subtareas: usar sub-issues cuando estén disponibles. En caso contrario,
  añadir `Part of #<parent>` al comienzo de la subtarea y enlazarla desde el padre.

## Pull requests as a triage surface

**PRs as a request surface: no.**

Los PRs no se incluyen como solicitudes externas en la cola de clasificación.
GitHub comparte numeración entre issues y PRs; comprobar el tipo al resolver
una referencia como `#42`.

## Cuando una skill pide publicar en el issue tracker

Crear un GitHub issue en este repositorio. Para recuperar un ticket relevante,
leer su issue y los comentarios necesarios.

## Wayfinding

- El mapa es un issue con la etiqueta `wayfinder:map`.
- Los tickets hijos usan `wayfinder:research`, `wayfinder:prototype`,
  `wayfinder:grilling` o `wayfinder:task`, según corresponda.
- Registrar bloqueos con dependencias nativas de GitHub. Si no están disponibles,
  usar una línea `Blocked by: #<n>` y comprobar que los bloqueadores estén cerrados.
- La frontera contiene tickets abiertos, sin bloqueadores abiertos y sin asignar;
  elegir el primero según el orden del mapa.
- Reclamar un ticket asignándolo a la persona que conduce el trabajo.
- Al resolverlo, guardar el resultado en el issue, cerrarlo y enlazar el contexto
  correspondiente en la sección de decisiones del mapa.
