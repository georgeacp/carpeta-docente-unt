from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema de Carpeta Docente UNT"
    VERSION: str = "1.0.0-MVP"
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/carpeta_docente_unt"
    JWT_SECRET_KEY: str = "unt-carpeta-docente-secret-key-2026-ii-acreditacion"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "./storage"
    MAX_UPLOAD_SIZE_MB: int = 20
    GOOGLE_CLIENT_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def storage_path(self) -> Path:
        path = Path(self.UPLOAD_DIR).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
