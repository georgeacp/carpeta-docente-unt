# Carpeta Docente UNT

## Desarrollo local (Windows)

El frontend usa Next.js y el backend usa FastAPI. Para ejecutar ambos desde una sola terminal, instala las dependencias desde la raíz del proyecto:

```powershell
npm install
npm --prefix frontend install
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

La creación del entorno virtual solo es necesaria si `backend/.venv` todavía no existe. Si ya tienes las dependencias instaladas, puedes omitir su instalación.

Para iniciar ambos servicios desde la raíz:

```powershell
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Documentación de la API: http://localhost:8000/docs

Los logs se identifican con `FRONT` y `BACK`. Usa `Ctrl+C` para detener ambos servicios. Si uno termina, también se detiene el otro.

También puedes ejecutar cada servicio por separado desde la raíz:

```powershell
npm run dev:front
npm run dev:back
```

El backend se ejecuta dentro de su carpeta para conservar las rutas de `.env`, almacenamiento y base de datos local.

## Anti-slop (solo este proyecto)

El plugin [anti-slop](https://github.com/dmmulroy/anti-slop) está copiado en
`tools/oxlint/anti-slop/` y configurado en `.oxlintrc.json`. Oxlint y su API de
plugins son dependencias de desarrollo de la raíz, con versiones exactas.
No requiere una instalación global y complementa el ESLint del frontend.

Desde la raíz:

```powershell
npm run lint:anti-slop
npm run lint
```

El primer comando ejecuta las reglas de anti-slop sobre el frontend; el segundo
ejecuta Oxlint y, si pasa, el ESLint existente. Las reglas pueden detectar
problemas previos a su instalación; no se han aplicado correcciones automáticas.

La skill para instalar o actualizar el plugin está en
`.agents/skills/install-anti-slop/`, con alcance limitado a este repositorio.
La revisión de origen y las decisiones de configuración se registran en
`tools/oxlint/anti-slop/UPSTREAM.md`.

Estos archivos, la configuración, `package.json` y `package-lock.json` deben
versionarse para reproducir las mismas reglas al clonar el proyecto. No deben
añadirse a `.gitignore`; las dependencias descargadas en `/node_modules/` ya
están excluidas.
