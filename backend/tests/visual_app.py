"""Disposable visual QA backend, only for the main localhost:8000 instance.

Run from backend: .venv/Scripts/python -m uvicorn visual_app:app --app-dir tests --host 127.0.0.1 --port 8000
All database records and files are fictitious and removed on shutdown.
"""
import os
from contextlib import asynccontextmanager

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app import ciclo
from app.core.config import settings
from app.db.database import get_db
from app.db.models import Usuario
from app.routers import admin, auth, carpetas, revision
from test_ciclo import CicloTest


@asynccontextmanager
async def lifespan(app):
    fixture = CicloTest()
    fixture.setUp()
    old_storage = settings.UPLOAD_DIR
    settings.UPLOAD_DIR = str(fixture.root)
    try:
        fixture.docente.nombre = "QA Docente ficticio"
        fixture.docente.email = "docente@unitru.edu.pe"
        fixture.director.nombre = "QA Director ficticio"
        fixture.director.email = "revisor@unitru.edu.pe"
        fixture.db.add(Usuario(nombre="QA Administración ficticia", email="admin@unitru.edu.pe", password_hash="qa-unused", rol="admin", escuela="Sistemas"))
        fixture.db.commit()
        fixture.completar(fixture.hitos[0])
        fixture.enviar()

        def database():
            with Session(fixture.engine) as session:
                yield session

        app.dependency_overrides[get_db] = database
        yield
    finally:
        app.dependency_overrides.clear()
        settings.UPLOAD_DIR = old_storage
        fixture.tearDown()


app = FastAPI(lifespan=lifespan)
for router in [auth.router, carpetas.router, revision.router, admin.router]:
    app.include_router(router)


@app.exception_handler(ciclo.ErrorCiclo)
async def cycle_error(request, error):
    return JSONResponse(status_code=error.status_code, content={"detail": str(error)})


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "fictitious-visual-qa"}
