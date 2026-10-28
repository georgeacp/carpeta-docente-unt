# Ciclo de carpeta docente

Primer incremento funcional acordado para el prototipo académico. No constituye normativa oficial de la UNT.

## Comportamiento

- Una carpeta tiene un único docente responsable. El Director puede presentar y revisar su propia carpeta; el dictamen deja constancia de la autorrevisión.
- Cada oferta de curso tiene tres hitos precargados: inicio, seguimiento y cierre integral. Los requisitos y fechas pertenecen al curso y semestre.
- Un parcial exige únicamente sus ítems obligatorios. El cierre exige todos los obligatorios de la carpeta y puede presentarse sin parciales previos.
- Una entrega conserva las versiones presentadas, su fecha límite y si fue tardía. Las presentaciones tardías están permitidas.
- El envío bloquea toda la carpeta durante la revisión. La evaluación documental se guarda como trabajo pendiente; solo el dictamen conjunto desbloquea la carpeta.
- El Director debe evaluar todos los documentos y explicar cada observación. Una aprobación parcial permite continuar; solo la aprobación del cierre bloquea definitivamente la carpeta.
- Cargar una corrección no resuelve una observación. La subsanación se confirma al concluir una revisión posterior que apruebe ese ítem; el resultado original permanece visible.
- Se permite una única entrega pendiente por carpeta. Los cambios de estado e historial se confirman juntos, con control de concurrencia.

## Alcance de la configuración inicial

Los requisitos de cada hito se precargan a partir de la plantilla demostrativa existente. Inicio utiliza sus ítems de planificación e inicio; seguimiento excluye los de cierre; cierre incluye la carpeta integral. Las fechas iniciales son demostrativas: inicio a los 14 días del comienzo, seguimiento a mitad del semestre y cierre según la fecha final registrada.

Esta carga inicial no sustituye un reglamento ni un editor de plantillas. El editor por curso y las prórrogas quedan para el siguiente incremento; la configuración publicada no se modifica desde estas pantallas.

Se conserva el versionado actual por ítem: cada carga sustituye la evidencia vigente del ítem y guarda las anteriores. La separación de varios documentos independientes dentro de un mismo ítem y la deduplicación física corresponden a la mejora de custodia documental, todavía pendiente.

## Datos anteriores y arranque

El arranque crea cinco tablas adicionales: `ciclos_carpeta`, `hitos_entrega`, `requisitos_hito`, `entregas` y `detalles_entrega`. Una inicialización idempotente incorpora los ciclos y hitos que falten, sin eliminar ni sobrescribir documentos, observaciones o acciones anteriores.

Los estados antiguos por ítem no se convierten en envíos históricos inexistentes. Cada carpeta inicia su ciclo formal en borrador y conserva su biblioteca e historial previo. Antes de actualizar una base compartida, se debe respaldar conjuntamente la base y el almacenamiento. El retroceso a la versión anterior puede dejar las tablas nuevas sin uso; no exige borrarlas.

## Organización

- `backend/app/ciclo.py` concentra autorización del ciclo, cargas, envíos, evaluación y dictamen.
- `backend/app/db/ciclo.py` define únicamente las tablas adicionales.
- Las rutas adaptan las solicitudes y devuelven la representación de la carpeta. Las rutas antiguas de dictamen sin entrega devuelven HTTP 410 para evitar eludir el flujo.
- Las descargas exigen autenticación y autorización. Un archivo ausente produce HTTP 404; no se inventa evidencia de reemplazo.

## Verificación

Desde la raíz, en Windows:

```powershell
npm run test:backend
npm run lint:anti-slop
```

Las pruebas del backend usan `unittest`, una base SQLite en memoria y archivos temporales aislados; no requieren instalar dependencias. Las pruebas HTTP sustituyen las dependencias de identidad y base de datos.

El recorrido de navegador está en `tests/e2e/ciclo.cjs` y utiliza únicamente la instancia principal: frontend 3000 y backend 8000. Antes de cualquier escritura exige la marca `fictitious-visual-qa` del backend de pruebas `backend/tests/visual_app.py`, con base en memoria y archivos ficticios temporales. No debe ejecutarse contra registros reales ni iniciar servicios en puertos alternativos. Las variables `CICLO_QA_BACKEND`, `CICLO_QA_FRONTEND` y `CICLO_QA_ARTIFACTS` identifican los servicios principales y la carpeta de capturas. La preparación y limpieza están documentadas en `docs/quality/impeccable.md`.

Los recorridos `tests/e2e/impeccable.cjs` y `tests/e2e/impeccable-visual.cjs` comprueban recuperación, accesibilidad de campos, plazos, progreso, borradores y adaptación visual con API ficticia en el navegador. No modifican registros del backend. No se crean instancias adicionales para compilaciones o verificaciones.

La concurrencia se verifica mediante conflictos de versión en SQLite. La ejecución concurrente sobre PostgreSQL debe comprobarse en el despliegue que utilice ese motor; las pruebas locales no certifican su comportamiento operativo.

## Resultados del primer incremento

- Pasaron 18 pruebas de dominio, transporte y aislamiento de metadatos.
- La compilación de producción con TypeScript se verificó en un directorio separado de la instancia de desarrollo.
- Chrome completó envío parcial, observación, corrección, reenvío, aprobación parcial y cierre integral sin presentación de seguimiento. Se comprobó el bloqueo y la conservación de los envíos anteriores.
- Se verificó ausencia de desbordamiento horizontal a 360, 768, 1024 y 1440 píxeles, sin errores de ejecución capturados.
- Una mutación en memoria que eliminaba el bloqueo de cargas durante el estado enviada hizo fallar su prueba de regresión; no se modificó el archivo real para realizar esa comprobación.
- Los módulos nuevos pasaron sus controles estáticos. El lint global presenta errores anteriores de efectos y referencias de React; no se desactivaron reglas para ocultarlos.
