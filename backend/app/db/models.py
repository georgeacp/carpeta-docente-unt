from datetime import datetime, date, timezone
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def utc_now():
    return datetime.now(timezone.utc)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(30), nullable=False, default="docente")  # docente | revisor | admin
    escuela = Column(String(120), nullable=True, default="Ingeniería de Sistemas")
    categoria = Column(String(80), nullable=True, default="Docente Ordinario - Principal")
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=utc_now)

    asignaciones = relationship("Asignacion", back_populates="docente")


class Semestre(Base):
    __tablename__ = "semestres"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)  # ej. 2026-II
    inicio = Column(Date, nullable=False)
    fin = Column(Date, nullable=False)
    fecha_limite = Column(DateTime, nullable=False)
    activo = Column(Boolean, default=True)

    asignaciones = relationship("Asignacion", back_populates="semestre")


class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(30), unique=True, nullable=False)  # ej. ING-304
    nombre = Column(String(180), nullable=False)
    escuela = Column(String(120), nullable=False, default="Ingeniería de Sistemas")
    ciclo = Column(Integer, nullable=False, default=6)

    asignaciones = relationship("Asignacion", back_populates="curso")


class Asignacion(Base):
    __tablename__ = "asignaciones"

    id = Column(Integer, primary_key=True, index=True)
    docente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    semestre_id = Column(Integer, ForeignKey("semestres.id"), nullable=False)
    seccion = Column(String(20), nullable=False, default="A")

    docente = relationship("Usuario", back_populates="asignaciones")
    curso = relationship("Curso", back_populates="asignaciones")
    semestre = relationship("Semestre", back_populates="asignaciones")
    carpeta = relationship("Carpeta", back_populates="asignacion", uselist=False, cascade="all, delete-orphan")


class PlantillaSeccion(Base):
    __tablename__ = "plantilla_secciones"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    obligatoria = Column(Boolean, default=True)
    orden = Column(Integer, nullable=False)
    tipos_permitidos = Column(String(120), default="pdf,docx,xlsx,png,jpg")


class Carpeta(Base):
    __tablename__ = "carpetas"

    id = Column(Integer, primary_key=True, index=True)
    asignacion_id = Column(Integer, ForeignKey("asignaciones.id"), unique=True, nullable=False)
    fecha_creacion = Column(DateTime, default=utc_now)
    ultima_actualizacion = Column(DateTime, default=utc_now, onupdate=utc_now)

    asignacion = relationship("Asignacion", back_populates="carpeta")
    secciones = relationship(
        "CarpetaSeccion",
        back_populates="carpeta",
        cascade="all, delete-orphan",
        order_by="CarpetaSeccion.id",
    )
    historial = relationship(
        "HistorialAccion",
        back_populates="carpeta",
        cascade="all, delete-orphan",
        order_by="desc(HistorialAccion.fecha)",
    )


class CarpetaSeccion(Base):
    __tablename__ = "carpeta_secciones"

    id = Column(Integer, primary_key=True, index=True)
    carpeta_id = Column(Integer, ForeignKey("carpetas.id"), nullable=False)
    plantilla_id = Column(Integer, ForeignKey("plantilla_secciones.id"), nullable=False)
    # Estados: pendiente | entregado | observado | aprobado
    estado = Column(String(30), nullable=False, default="pendiente")

    carpeta = relationship("Carpeta", back_populates="secciones")
    plantilla = relationship("PlantillaSeccion")
    documentos = relationship(
        "Documento",
        back_populates="carpeta_seccion",
        cascade="all, delete-orphan",
        order_by="desc(Documento.version)",
    )
    observaciones = relationship(
        "Observacion",
        back_populates="carpeta_seccion",
        cascade="all, delete-orphan",
        order_by="desc(Observacion.fecha)",
    )


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True)
    carpeta_seccion_id = Column(Integer, ForeignKey("carpeta_secciones.id"), nullable=False)
    nombre = Column(String(255), nullable=False)
    ruta = Column(String(500), nullable=False)
    tamano_mb = Column(Float, default=0.1)
    version = Column(Integer, nullable=False, default=1)
    subido_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(DateTime, default=utc_now)

    carpeta_seccion = relationship("CarpetaSeccion", back_populates="documentos")
    autor = relationship("Usuario")


class Observacion(Base):
    __tablename__ = "observaciones"

    id = Column(Integer, primary_key=True, index=True)
    carpeta_seccion_id = Column(Integer, ForeignKey("carpeta_secciones.id"), nullable=False)
    revisor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    texto = Column(Text, nullable=False)
    resuelta = Column(Boolean, default=False)
    fecha = Column(DateTime, default=utc_now)

    carpeta_seccion = relationship("CarpetaSeccion", back_populates="observaciones")
    revisor = relationship("Usuario")


class HistorialAccion(Base):
    __tablename__ = "historial_acciones"

    id = Column(Integer, primary_key=True, index=True)
    carpeta_id = Column(Integer, ForeignKey("carpetas.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    accion = Column(String(120), nullable=False)
    detalle = Column(Text, nullable=True)
    fecha = Column(DateTime, default=utc_now)

    carpeta = relationship("Carpeta", back_populates="historial")
    usuario = relationship("Usuario")
