from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import ciclo
from app.core.security import get_current_user, require_roles
from app.db.database import get_db
from app.db.models import Asignacion, Carpeta, Curso, Usuario
from app.db.serializers import serialize_carpeta_detail, serialize_carpeta_summary

router = APIRouter(prefix="/api/revision", tags=["Revisión y Dirección de Escuela"])


class EvaluarDocumentoRequest(BaseModel):
    dictamen: Literal["aprobado", "observado"]
    comentario: str | None = Field(default=None, max_length=5000)


@router.get("/carpetas")
def listar_carpetas_revisor(
    semestre_id: int | None = None,
    estado_global: str | None = None,
    current_user: Usuario = Depends(require_roles(["revisor"])),
    db: Session = Depends(get_db),
):
    query = db.query(Carpeta).join(Asignacion).join(Curso).filter(Curso.escuela == current_user.escuela)
    if semestre_id:
        query = query.filter(Asignacion.semestre_id == semestre_id)
    todas = [serialize_carpeta_summary(c) for c in query.all()]
    items = todas
    if estado_global and estado_global != "todos":
        items = [i for i in todas if i["metricas"]["estado_global"] == estado_global]
    resumen = {
        "total_carpetas": len(todas),
        "aprobadas": sum(x["estado_ciclo"] == "aprobada" for x in todas),
        "completas_en_revision": sum(x["estado_ciclo"] in ("enviada", "reenviada") for x in todas),
        "observadas": sum(x["estado_ciclo"] == "observada" for x in todas),
        "en_progreso": sum(x["estado_ciclo"] in ("borrador", "en_progreso") for x in todas),
        "vencidas": sum(x["metricas"]["vencida"] for x in todas),
        "promedio_avance": round(sum(x["metricas"]["porcentaje_avance"] for x in todas) / len(todas)) if todas else 0,
    }
    return {"resumen": resumen, "carpetas": items}


@router.put("/entregas/{entrega_id}/documentos/{detalle_id}")
def evaluar_documento(
    entrega_id: int,
    detalle_id: int,
    payload: EvaluarDocumentoRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entrega = ciclo.evaluar(db, entrega_id, detalle_id, current_user, payload.dictamen, payload.comentario)
    return serialize_carpeta_detail(db.get(Carpeta, entrega.carpeta_id))


@router.post("/entregas/{entrega_id}/dictamen")
def concluir_entrega(
    entrega_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entrega = ciclo.concluir(db, entrega_id, current_user)
    return serialize_carpeta_detail(db.get(Carpeta, entrega.carpeta_id))


@router.patch("/secciones/{seccion_id}/estado", deprecated=True)
@router.post("/secciones/{seccion_id}/observaciones", deprecated=True)
def revision_sin_entrega(seccion_id: int, current_user: Usuario = Depends(get_current_user)):
    raise HTTPException(status_code=410, detail="Revise una entrega formal y concluya su dictamen integral.")
