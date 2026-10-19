from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, require_roles
from app.db.database import get_db
from app.db.models import (
    Asignacion,
    Carpeta,
    Curso,
    PlantillaSeccion,
    Semestre,
    Usuario,
)
from app.db.seed import crear_carpeta_para_asignacion
from app.db.serializers import serialize_carpeta_summary

router = APIRouter(prefix="/api/admin", tags=["Administración Académica"])


class CrearSemestreRequest(BaseModel):
    nombre: str
    inicio: date
    fin: date
    fecha_limite: datetime
    activo: bool = True


class CrearCursoRequest(BaseModel):
    codigo: str
    nombre: str
    escuela: str = "Ingeniería de Sistemas"
    ciclo: int = 6


class CrearUsuarioRequest(BaseModel):
    nombre: str
    email: str
    password: str = "unt2026"
    rol: str = "docente"
    escuela: str = "Ingeniería de Sistemas"
    categoria: str = "Docente Ordinario"


class CrearAsignacionRequest(BaseModel):
    docente_id: int
    curso_id: int
    semestre_id: int
    seccion: str = "A"


@router.get("/catalogo")
def obtener_catalogo_completo(
    current_user: Usuario = Depends(require_roles(["admin", "revisor", "docente"])),
    db: Session = Depends(get_db),
):
    semestres = db.query(Semestre).order_by(Semestre.id.desc()).all()
    cursos = db.query(Curso).order_by(Curso.ciclo.asc(), Curso.codigo.asc()).all()
    usuarios = db.query(Usuario).order_by(Usuario.rol.asc(), Usuario.nombre.asc()).all()
    plantillas = db.query(PlantillaSeccion).order_by(PlantillaSeccion.orden.asc()).all()
    carpetas = db.query(Carpeta).all()

    return {
        "semestres": [
            {
                "id": s.id,
                "nombre": s.nombre,
                "inicio": s.inicio.isoformat(),
                "fin": s.fin.isoformat(),
                "fecha_limite": s.fecha_limite.isoformat(),
                "activo": s.activo,
            }
            for s in semestres
        ],
        "cursos": [
            {
                "id": c.id,
                "codigo": c.codigo,
                "nombre": c.nombre,
                "escuela": c.escuela,
                "ciclo": c.ciclo,
            }
            for c in cursos
        ],
        "usuarios": [
            {
                "id": u.id,
                "nombre": u.nombre,
                "email": u.email,
                "rol": u.rol,
                "escuela": u.escuela,
                "categoria": u.categoria,
                "activo": u.activo,
            }
            for u in usuarios
        ],
        "plantillas": [
            {
                "id": p.id,
                "orden": p.orden,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "obligatoria": p.obligatoria,
                "tipos_permitidos": p.tipos_permitidos,
            }
            for p in plantillas
        ],
        "asignaciones": [serialize_carpeta_summary(c) for c in carpetas],
    }


@router.post("/semestres")
def crear_semestre(
    payload: CrearSemestreRequest,
    current_user: Usuario = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    existente = db.query(Semestre).filter(Semestre.nombre == payload.nombre.strip()).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un semestre con ese nombre.")

    if payload.activo:
        for s in db.query(Semestre).all():
            s.activo = False

    nuevo = Semestre(
        nombre=payload.nombre.strip(),
        inicio=payload.inicio,
        fin=payload.fin,
        fecha_limite=payload.fecha_limite,
        activo=payload.activo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"id": nuevo.id, "nombre": nuevo.nombre, "activo": nuevo.activo}


@router.post("/cursos")
def crear_curso(
    payload: CrearCursoRequest,
    current_user: Usuario = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    codigo_clean = payload.codigo.strip().upper()
    if db.query(Curso).filter(Curso.codigo == codigo_clean).first():
        raise HTTPException(status_code=400, detail=f"El código de curso {codigo_clean} ya está registrado.")

    nuevo = Curso(
        codigo=codigo_clean,
        nombre=payload.nombre.strip(),
        escuela=payload.escuela.strip(),
        ciclo=payload.ciclo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"id": nuevo.id, "codigo": nuevo.codigo, "nombre": nuevo.nombre}


@router.post("/usuarios")
def crear_usuario(
    payload: CrearUsuarioRequest,
    current_user: Usuario = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    email_clean = payload.email.strip().lower()
    if db.query(Usuario).filter(Usuario.email == email_clean).first():
        raise HTTPException(status_code=400, detail="El correo institucional ya se encuentra registrado.")

    nuevo = Usuario(
        nombre=payload.nombre.strip(),
        email=email_clean,
        password_hash=get_password_hash(payload.password or "unt2026"),
        rol=payload.rol,
        escuela=payload.escuela,
        categoria=payload.categoria,
        activo=True,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"id": nuevo.id, "nombre": nuevo.nombre, "email": nuevo.email, "rol": nuevo.rol}


@router.post("/asignaciones")
def crear_asignacion_con_carpeta(
    payload: CrearAsignacionRequest,
    current_user: Usuario = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    # Verificar duplicado
    dup = (
        db.query(Asignacion)
        .filter(
            Asignacion.docente_id == payload.docente_id,
            Asignacion.curso_id == payload.curso_id,
            Asignacion.semestre_id == payload.semestre_id,
            Asignacion.seccion == payload.seccion.strip().upper(),
        )
        .first()
    )
    if dup:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una asignación y carpeta generada para este docente, curso, semestre y sección.",
        )

    nueva_asig = Asignacion(
        docente_id=payload.docente_id,
        curso_id=payload.curso_id,
        semestre_id=payload.semestre_id,
        seccion=payload.seccion.strip().upper(),
    )
    db.add(nueva_asig)
    db.flush()

    # RF4: Generar carpeta y secciones automáticamente
    carpeta = crear_carpeta_para_asignacion(db, nueva_asig, current_user.id)
    db.commit()
    db.refresh(carpeta)
    return serialize_carpeta_summary(carpeta)
