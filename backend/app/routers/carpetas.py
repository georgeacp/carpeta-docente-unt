import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import (
    Asignacion,
    Carpeta,
    CarpetaSeccion,
    Documento,
    HistorialAccion,
    Observacion,
    Usuario,
)
from app.db.serializers import serialize_carpeta_detail, serialize_carpeta_summary

router = APIRouter(prefix="/api/carpetas", tags=["Carpetas Docentes"])


def _sanitize_filename(filename: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
    return clean[:180] or "documento_unt.pdf"


@router.get("/mis-carpetas")
def listar_mis_carpetas(
    semestre_id: int | None = None,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Carpeta).join(Asignacion)
    if current_user.rol == "docente":
        query = query.filter(Asignacion.docente_id == current_user.id)
    if semestre_id:
        query = query.filter(Asignacion.semestre_id == semestre_id)

    carpetas = query.all()
    return [serialize_carpeta_summary(c) for c in carpetas]


@router.get("/{carpeta_id}")
def obtener_detalle_carpeta(
    carpeta_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    carpeta = db.query(Carpeta).filter(Carpeta.id == carpeta_id).first()
    if not carpeta:
        raise HTTPException(status_code=404, detail="Carpeta docente no encontrada.")

    # RNF Acceso por rol: un docente solo ve sus carpetas
    if current_user.rol == "docente" and carpeta.asignacion.docente_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver la carpeta de otro docente.",
        )

    return serialize_carpeta_detail(carpeta)


@router.post("/secciones/{seccion_id}/documentos")
async def subir_documento_seccion(
    seccion_id: int,
    archivo: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seccion = db.query(CarpetaSeccion).filter(CarpetaSeccion.id == seccion_id).first()
    if not seccion:
        raise HTTPException(status_code=404, detail="Sección de carpeta no encontrada.")

    carpeta = seccion.carpeta
    if current_user.rol == "docente" and carpeta.asignacion.docente_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el docente titular puede subir archivos a esta carpeta.",
        )

    # Validar extensión según PlantillaSeccion
    filename_orig = archivo.filename or "documento.pdf"
    ext = filename_orig.rsplit(".", 1)[-1].lower() if "." in filename_orig else ""
    permitidos = [
        t.strip().lower() for t in (seccion.plantilla.tipos_permitidos or "pdf,docx,xlsx,png,jpg").split(",")
    ]
    if ext not in permitidos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato '.{ext}' no permitido en esta sección. Formatos aceptados: {', '.join(permitidos).upper()}",
        )

    # Leer contenido y validar tamaño máximo (20 MB)
    content = await archivo.read()
    size_mb = round(len(content) / (1024 * 1024), 2)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo supera el límite máximo permitido de {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )
    if size_mb == 0:
        size_mb = 0.05

    # Calcular versión incremental (RF5)
    versiones_previas = [d.version for d in seccion.documentos]
    nueva_version = (max(versiones_previas) + 1) if versiones_previas else 1

    safe_name = _sanitize_filename(filename_orig)
    sem_nom = _sanitize_filename(carpeta.asignacion.semestre.nombre)
    cur_cod = _sanitize_filename(carpeta.asignacion.curso.codigo)
    sec_let = _sanitize_filename(carpeta.asignacion.seccion)

    rel_path = f"{sem_nom}/{cur_cod}_{sec_let}/sec_{seccion.plantilla.orden}/v{nueva_version}_{safe_name}"
    abs_path = settings.storage_path / rel_path
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    abs_path.write_bytes(content)

    nuevo_doc = Documento(
        carpeta_seccion_id=seccion.id,
        nombre=filename_orig,
        ruta=rel_path,
        tamano_mb=size_mb,
        version=nueva_version,
        subido_por=current_user.id,
    )
    db.add(nuevo_doc)

    # RF6: Actualizar estado a entregado y marcar observaciones anteriores como subsanadas
    estado_anterior = seccion.estado
    seccion.estado = "entregado"
    for obs in seccion.observaciones:
        if not obs.resuelta:
            obs.resuelta = True

    carpeta.ultima_actualizacion = datetime.now(timezone.utc)

    # RF10: Registrar en historial de acciones
    accion_tipo = "DOCUMENTO_REEMPLAZADO" if nueva_version > 1 else "DOCUMENTO_SUBIDO"
    db.add(
        HistorialAccion(
            carpeta_id=carpeta.id,
            usuario_id=current_user.id,
            accion=accion_tipo,
            detalle=f"Subió '{filename_orig}' (Versión {nueva_version}, {size_mb} MB) en '{seccion.plantilla.nombre}'. Estado pasó de '{estado_anterior}' a 'entregado'.",
        )
    )

    db.commit()
    db.refresh(carpeta)
    return serialize_carpeta_detail(carpeta)


@router.get("/documentos/{documento_id}/descargar")
def descargar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
):
    doc = db.query(Documento).filter(Documento.id == documento_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")

    file_path = settings.storage_path / doc.ruta
    if not file_path.exists():
        # Auto-regenerar archivo PDF demostrativo si fue limpiado
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(b"%PDF-1.4\n% Documento Carpeta Docente UNT\n%%EOF")

    return FileResponse(
        path=str(file_path),
        filename=f"v{doc.version}_{doc.nombre}",
        media_type="application/octet-stream",
    )
