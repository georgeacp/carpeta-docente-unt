# Domain Docs

Este proyecto utiliza un único contexto de dominio.

## Antes de explorar el código

- Leer `GLOSSARY.md` en la raíz, cuando exista.
- Leer los ADRs de `docs/adr/` relacionados con el área del trabajo.
- Si en el futuro existe `GLOSSARY-MAP.md`, seguir sus enlaces hacia los
  glosarios relevantes.

Si esos archivos no existen, continuar silenciosamente. No crear glosarios,
ADRs ni archivos vacíos solo por ejecutar la configuración inicial.
`domain-modeling`, también utilizada desde `grill-with-docs` y
`improve-codebase-architecture`, los crea cuando se resuelven términos o decisiones.

## Estructura

- `GLOSSARY.md`: vocabulario compartido del proyecto.
- `docs/adr/`: registros numerados de decisiones de arquitectura.

## Usar el vocabulario del dominio

Utilizar los términos del glosario en títulos, propuestas, hipótesis, pruebas
y explicaciones. Evitar sinónimos que el glosario descarte explícitamente.
Cuando falte un concepto, comprobar si pertenece al dominio o si debe tratarse
en una futura sesión de `domain-modeling`.

## Conflictos con decisiones previas

Si una propuesta contradice un ADR existente, identificarlo y explicar la
razón para reconsiderarlo, en lugar de sobrescribirlo silenciosamente.
