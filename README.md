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
