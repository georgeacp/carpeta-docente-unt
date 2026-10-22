from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class CicloCarpeta(Base):
    __tablename__ = "ciclos_carpeta"
    carpeta_id = Column(Integer, ForeignKey("carpetas.id"), primary_key=True)
    estado = Column(String(30), nullable=False, default="borrador")
    version = Column(Integer, nullable=False, default=1)
    __mapper_args__ = {"version_id_col": version}


class HitoEntrega(Base):
    __tablename__ = "hitos_entrega"
    __table_args__ = (UniqueConstraint("curso_id", "semestre_id", "codigo"),)
    id = Column(Integer, primary_key=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    semestre_id = Column(Integer, ForeignKey("semestres.id"), nullable=False)
    codigo = Column(String(20), nullable=False)
    nombre = Column(String(80), nullable=False)
    orden = Column(Integer, nullable=False)
    fecha_limite = Column(DateTime(timezone=True), nullable=False)
    requisitos = relationship("RequisitoHito", order_by="RequisitoHito.plantilla_id")


class RequisitoHito(Base):
    __tablename__ = "requisitos_hito"
    hito_id = Column(Integer, ForeignKey("hitos_entrega.id"), primary_key=True)
    plantilla_id = Column(Integer, ForeignKey("plantilla_secciones.id"), primary_key=True)


class Entrega(Base):
    __tablename__ = "entregas"
    __table_args__ = (UniqueConstraint("carpeta_id", "hito_id", "numero"),)
    id = Column(Integer, primary_key=True)
    carpeta_id = Column(Integer, ForeignKey("carpetas.id"), nullable=False, index=True)
    hito_id = Column(Integer, ForeignKey("hitos_entrega.id"), nullable=False)
    numero = Column(Integer, nullable=False)
    estado = Column(String(20), nullable=False, default="pendiente")
    # La unicidad conserva un solo envío pendiente por carpeta, también entre procesos.
    pendiente_carpeta_id = Column(Integer, ForeignKey("carpetas.id"), nullable=True, unique=True)
    enviada_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    enviada_en = Column(DateTime(timezone=True), nullable=False)
    fecha_limite = Column(DateTime(timezone=True), nullable=False)
    tardia = Column(Boolean, nullable=False)
    director_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    dictaminada_en = Column(DateTime(timezone=True), nullable=True)
    hito = relationship("HitoEntrega")
    detalles = relationship("DetalleEntrega", foreign_keys="DetalleEntrega.entrega_id", order_by="DetalleEntrega.id")


class DetalleEntrega(Base):
    __tablename__ = "detalles_entrega"
    __table_args__ = (UniqueConstraint("entrega_id", "seccion_id"),)
    id = Column(Integer, primary_key=True)
    entrega_id = Column(Integer, ForeignKey("entregas.id"), nullable=False)
    seccion_id = Column(Integer, ForeignKey("carpeta_secciones.id"), nullable=False)
    documento_id = Column(Integer, ForeignKey("documentos.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    nombre = Column(String(255), nullable=False)
    version = Column(Integer, nullable=False)
    obligatorio = Column(Boolean, nullable=False)
    dictamen = Column(String(20), nullable=False, default="pendiente")
    comentario = Column(Text, nullable=True)
    evaluado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    subsanada_en_entrega_id = Column(Integer, ForeignKey("entregas.id"), nullable=True)
