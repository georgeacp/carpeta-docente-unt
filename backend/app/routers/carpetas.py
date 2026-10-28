from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import ciclo
from app.core.config import settings
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Asignacion, Carpeta, Documento, Usuario
from app.db.serializers import serialize_carpeta_detail, serialize_carpeta_summary

router = APIRouter(prefix="/api/carpetas", tags=["Carpetas Docentes"])


class EnviarEntregaRequest(BaseModel):
    hito_id: int


@router.get("/mis-carpetas")
def listar_mis_carpetas(
    semestre_id: int | None = None,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Carpeta).join(Asignacion).filter(Asignacion.docente_id == current_user.id)
    if semestre_id:
        query = query.filter(Asignacion.semestre_id == semestre_id)
    return [serialize_carpeta_summary(c) for c in query.all()]


@router.get("/{carpeta_id}")
def obtener_detalle_carpeta(
    carpeta_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    carpeta = db.get(Carpeta, carpeta_id)
    if carpeta is None:
        raise HTTPException(status_code=404, detail="Carpeta docente no encontrada.")
    ciclo.autorizar(carpeta, current_user)
    return serialize_carpeta_detail(carpeta)


@router.post("/secciones/{seccion_id}/documentos")
async def subir_documento_seccion(
    seccion_id: int,
    archivo: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limite = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    try:
        contenido = await archivo.read(limite + 1)
        if len(contenido) > limite:
            raise HTTPException(status_code=413, detail=f"El archivo supera {settings.MAX_UPLOAD_SIZE_MB} MiB.")
        documento = ciclo.cargar(db, seccion_id, current_user, archivo.filename or "documento.pdf", contenido, settings.storage_path)
        return serialize_carpeta_detail(documento.carpeta_seccion.carpeta)
    finally:
        await archivo.close()


@router.post("/{carpeta_id}/entregas")
def enviar_entrega(
    carpeta_id: int,
    payload: EnviarEntregaRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ciclo.enviar(db, carpeta_id, payload.hito_id, current_user, settings.storage_path)
    return serialize_carpeta_detail(db.get(Carpeta, carpeta_id))


@router.get("/documentos/{documento_id}/descargar")
def descargar_documento(
    documento_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documento = db.get(Documento, documento_id)
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    ciclo.autorizar(documento.carpeta_seccion.carpeta, current_user)
    raiz = settings.storage_path
    archivo = (raiz / documento.ruta).resolve()
    if not archivo.is_relative_to(raiz) or not archivo.is_file():
        raise HTTPException(status_code=404, detail="El archivo no está disponible. No se ha alterado su registro histórico.")
    return FileResponse(str(archivo), filename=f"v{documento.version}_{documento.nombre}", media_type="application/octet-stream")
