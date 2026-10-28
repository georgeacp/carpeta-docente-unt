# Interfaz de Carpeta Docente

## Dirección

Aplicación de trabajo académico para docentes, Directores de Escuela y administradores. La interfaz prioriza localizar el curso, entender el estado documental y continuar una tarea. Modo Operate de Impeccable; variación 3/10, movimiento 3/10 y densidad 5/10.

## Lenguaje visual

- Azul institucional para selección, foco y acciones. Colores semánticos reservados para resultados y observaciones.
- Fondos claros y neutros; tema oscuro con la misma jerarquía. Tokens compartidos en `frontend/src/app/globals.css`.
- Una familia sans, títulos de 24–28 px, texto de interfaz de 14–16 px y datos con cifras tabulares.
- Resúmenes sin tarjetas individuales. Cursos en filas con estado, avance y acceso. Contenedores solo para agrupar una tarea o colección.
- Escudo existente y nombres reales de la institución. Sin retratos de ejemplo, avisos ficticios de pagos, ornamentos geométricos ni afirmaciones de oficialidad del prototipo.

## Interacción

- Estados explícitos de carga, vacío y error; el fallo de conexión ofrece un reintento.
- Navegación lateral en escritorio y panel accesible en móvil. Acceso directo al contenido mediante teclado.
- Transiciones breves para controles, progreso documental y accesos rápidos. Sin entradas escalonadas ni animación del ancho del menú.
- Respetar `prefers-reduced-motion`; mantener el contenido legible sin movimiento.
- Lenguaje de dominio de `GLOSSARY.md`. Los códigos de requisitos no aparecen en controles de uso diario.
- El acceso de demostración se identifica como tal y se presenta mediante divulgación progresiva.

## Verificación

Las correcciones incrementales de perfil, administración y revisión cuentan con recorridos en `tests/e2e/impeccable.cjs`, capturas y reflujo en `tests/e2e/impeccable-visual.cjs` y el ciclo completo en `tests/e2e/ciclo.cjs`. Todos utilizan exclusivamente los puertos principales 3000/8000. Para el ciclo con escrituras, `backend/tests/visual_app.py` ofrece registros ficticios en memoria y el recorrido verifica su marca antes de escribir. Véase `docs/quality/impeccable.md`.

`tests/e2e/interfaz.cjs` comprueba las vistas por rol, escritorio y móvil, filtros, tema oscuro, movimiento reducido y estados de carga fallida y vacío. Usa `UI_QA_FRONTEND` para una instancia local y `UI_QA_ARTIFACTS` para guardar capturas; no sube documentos ni emite decisiones académicas.
