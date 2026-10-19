from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.database import get_db
from app.db.models import (
    Asignacion,
    Carpeta,
    CarpetaSeccion,
    HistorialAccion,
    Observacion,
    Usuario,
)
from app.db.serializers import serialize_carpeta_detail, serialize_carpeta_summary

router = APIRouter(prefix="/api/revision", tags=["Revisión y Dirección de Escuela"])


class CambiarEstadoRequest(BaseModel):
    estado: str  # aprobado | observado | entregado | pendiente
    comentario: str | None = None


class CrearObservacionRequest(BaseModel):
    texto: str


@router.get("/carpetas")
def listar_carpetas_revisor(
    semestre_id: int | None = None,
    estado_global: str | None = None,
    current_user: Usuario = Depends(require_roles(["revisor", "admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Carpeta).join(Asignacion)
    if semestre_id:
        query = query.filter(Asignacion.semestre_id == semestre_id)

    carpetas = query.all()
    items = [serialize_carpeta_summary(c) for c in carpetas]

    if estado_global and estado_global != "todos":
        items = [i for i in items if i["metricas"]["estado_global"] == estado_global]

    # Resumen global para el panel del revisor (RF9)
    todas = [serialize_carpeta_summary(c) for c in carpetas]
    resumen = {
        "total_carpetas": len(todas),
        "aprobadas": sum(1 for x in todas if x["metricas"]["estado_global"] == "aprobada"),
        "completas_en_revision": sum(
            1 for x in todas if x["metricas"]["estado_global"] == "completa_en_revision"
        ),
        "observadas": sum(1 for x in todas if x["metricas"]["estado_global"] == "observada"),
        "en_progreso": sum(1 for x in todas if x["metricas"]["estado_global"] == "en_progreso"),
        "vencidas": sum(1 for x in todas if x["metricas"]["vencida"]),
        "promedio_avance": round(
            sum(x["metricas"]["porcentaje_avance"] for x in todas) / (len(todas) or 1)
        ),
    }

    return {"resumen": resumen, "carpetas": items}


@router.patch("/secciones/{seccion_id}/estado")
def dictaminar_estado_seccion(
    seccion_id: int,
    payload: CambiarEstadoRequest,
    current_user: Usuario = Depends(require_roles(["revisor", "admin"])),
    db: Session = Depends(get_db),
):
    if payload.estado not in ("pendiente", "entregado", "observado", "aprobado"):
        raise HTTPException(status_code=400, detail="Estado no válido.")

    seccion = db.query(CarpetaSeccion).filter(CarpetaSeccion.id == seccion_id).first()
    if not seccion:
        raise HTTPException(status_code=404, detail="Sección no encontrada.")

    seccion.estado = payload.estado
    carpeta = seccion.carpeta
    carpeta.ultima_actualizacion = datetime.now(timezone.utc)

    if payload.estado == "aprobado":
        for obs in seccion.observaciones:
            obs.resuelta = True

    if payload.comentario and payload.comentario.strip():
        db.add(
            Observacion(
                carpeta_seccion_id=seccion.id,
                revisor_id=current_user.id,
                texto=payload.comentario.strip(),
                resuelta=(payload.estado == "aprobado"),
            )
        )

    accion_label = (
        "SECCION_APROBADA"
        if payload.estado == "aprobado"
        else "SECCION_OBSERVADA"
        if payload.estado == "observado"
        else "ESTADO_ACTUALIZADO"
    )
    detalle_msg = f"Cambió el estado de '{seccion.plantilla.nombre}' a '{payload.estado.upper()}'."
    if payload.comentario:
        detalle_msg += f" Nota: {payload.comentario.strip()}"

    db.add(
        HistorialAccion(
            carpeta_id=carpeta.id,
            usuario_id=current_user.id,
            accion=accion_label,
            detalle=detalle_msg,
        )
    )

    db.commit()
    db.refresh(carpeta)
    return serialize_carpeta_detail(carpeta)


@router.post("/secciones/{seccion_id}/observaciones")
def registrar_observacion(
    seccion_id: int,
    payload: CrearObservacionRequest,
    current_user: Usuario = Depends(require_roles(["revisor", "admin"])),
    db: Session = Depends(get_db),
):
    if not payload.texto.strip():
        raise HTTPException(status_code=400, detail="El texto de la observación no puede estar vacío.")

    seccion = db.query(CarpetaSeccion).filter(CarpetaSeccion.id == seccion_id).first()
    if not seccion:
        raise HTTPException(status_code=404, detail="Sección no encontrada.")

    seccion.estado = "observado"
    carpeta = seccion.carpeta
    carpeta.ultima_actualizacion = datetime.now(timezone.utc)

    obs = Observacion(
        carpeta_seccion_id=seccion.id,
        revisor_id=current_user.id,
        texto=payload.texto.strip(),
        resuelta=False,
    )
    db.add(obs)

    db.add(
        HistorialAccion(
            carpeta_id=carpeta.id,
            usuario_id=current_user.id,
            accion="OBSERVACION_REGISTRADA",
            detalle=f"Observó '{seccion.plantilla.nombre}': {payload.texto.strip()}",
        )
    )

    db.commit()
    db.refresh(carpeta)
    return serialize_carpeta_detail(carpeta)
