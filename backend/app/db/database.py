import logging
from urllib.parse import urlparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base

logger = logging.getLogger("uvicorn.error")

ACTIVE_DB_ENGINE = "postgresql"
ACTIVE_DB_URL = settings.DATABASE_URL


def _init_engine():
    global ACTIVE_DB_ENGINE, ACTIVE_DB_URL
    db_url = settings.DATABASE_URL

    if db_url.startswith("postgresql"):
        try:
            # Try connecting directly to target PostgreSQL DB
            engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            ACTIVE_DB_ENGINE = "PostgreSQL"
            ACTIVE_DB_URL = db_url
            logger.info("Conectado exitosamente a PostgreSQL (%s)", db_url.split("@")[-1])
            return engine
        except Exception as first_err:
            # Try creating the database if PostgreSQL server is running but DB does not exist
            try:
                parsed = urlparse(db_url)
                target_db = parsed.path.lstrip("/")
                admin_url = db_url.rsplit("/", 1)[0] + "/postgres"
                admin_engine = create_engine(
                    admin_url,
                    isolation_level="AUTOCOMMIT",
                    connect_args={"connect_timeout": 3},
                )
                with admin_engine.connect() as conn:
                    exists = conn.execute(
                        text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                        {"dbname": target_db},
                    ).scalar()
                    if not exists:
                        conn.execute(text(f'CREATE DATABASE "{target_db}"'))
                        logger.info("Base de datos PostgreSQL '%s' creada automaticamente.", target_db)
                admin_engine.dispose()

                engine = create_engine(db_url, pool_pre_ping=True)
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                ACTIVE_DB_ENGINE = "PostgreSQL"
                ACTIVE_DB_URL = db_url
                return engine
            except Exception as pg_err:
                logger.warning(
                    "No se pudo conectar a PostgreSQL (%s). Usando motor SQLite local de respaldo (carpeta_docente_unt.db) hasta que ajustes las credenciales en backend/.env.",
                    pg_err,
                )
                sqlite_url = "sqlite:///./carpeta_docente_unt.db"
                ACTIVE_DB_ENGINE = "SQLite (Fallback - Ajustar credenciales Postgres en .env)"
                ACTIVE_DB_URL = sqlite_url
                return create_engine(sqlite_url, connect_args={"check_same_thread": False})

    ACTIVE_DB_ENGINE = "SQLite"
    return create_engine(db_url, connect_args={"check_same_thread": False})


engine = _init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
