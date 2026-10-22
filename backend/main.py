from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app import ciclo

from app.core.config import settings
from app.db.database import ACTIVE_DB_ENGINE, Base, SessionLocal, engine
from app.db.seed import seed_initial_data
from app.routers import admin, auth, carpetas, revision


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas e inicializar datos semilla de la UNT
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
        ciclo.inicializar(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API Backend para el Sistema de Carpeta Docente de la Universidad Nacional de Trujillo (UNT)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(carpetas.router)
app.include_router(revision.router)
app.include_router(admin.router)


@app.exception_handler(ciclo.ErrorCiclo)
async def error_ciclo(request, error):
    return JSONResponse(status_code=error.status_code, content={"detail": str(error)})


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "sistema": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_engine": ACTIVE_DB_ENGINE,
    }


@app.get("/")
def root():
    return {
        "mensaje": "API Carpeta Docente UNT operativa",
        "docs": "/docs",
        "motor_bd": ACTIVE_DB_ENGINE,
    }
