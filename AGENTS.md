# Carpeta Docente UNT

## Instancia principal para pruebas

- Todas las pruebas de interfaz, integración y extremo a extremo que requieran servidores deben utilizar la instancia principal: frontend en `http://localhost:3000` y backend en `http://localhost:8000`.
- Antes de iniciar servidores, comprobar si la instancia principal ya está activa y reutilizarla. Si está apagada, levantar únicamente los servicios necesarios en esos mismos puertos.
- No ejecutar instancias adicionales del proyecto ni utilizar puertos alternativos para pruebas, compilaciones o verificaciones, salvo autorización explícita del usuario. Si un puerto está ocupado o una prueba requiere aislamiento, resolverlo sin crear otra instancia; si no es posible, informar la limitación.
- Las pruebas que modifiquen datos deben utilizar datos ficticios identificables y evitar alterar registros existentes del usuario.
- Al terminar, cerrar los procesos temporales iniciados por el agente y verificar su cierre. Mantener los servicios que el usuario ya tenía activos; dejar un servicio iniciado por el agente funcionando solo cuando el usuario lo haya solicitado.

## Agent skills

### Issue tracker

Las tareas y especificaciones se gestionan en GitHub Issues de
`georgeacp/carpeta-docente-unt`. See `docs/agents/issue-tracker.md`.

### Triage labels

Se utilizan `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`
y `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` en la raíz y decisiones en `docs/adr/`.
See `docs/agents/domain.md`.
