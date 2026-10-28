from datetime import datetime, timezone
from app.db.models import Carpeta
from app.db.ciclo import CicloCarpeta
from sqlalchemy.orm import object_session


def iso_utc(value):
    if value is None:
        return None
    aware = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
    return aware.astimezone(timezone.utc).isoformat()


def serialize_carpeta_summary(carpeta: Carpeta) -> dict:
    asignacion = carpeta.asignacion
    docente = asignacion.docente
    curso = asignacion.curso
    semestre = asignacion.semestre

    secciones_ordenadas = sorted(carpeta.secciones, key=lambda s: s.plantilla.orden)
    obligatorias = [s for s in secciones_ordenadas if s.plantilla.obligatoria]
    total_obligatorias = len(obligatorias)

    # RF8: Avance porcentual de la carpeta (secciones obligatorias con documento entregado/aprobado)
    completadas = [
        s for s in obligatorias if len(s.documentos) > 0
    ]
    aprobadas = [s for s in obligatorias if s.estado == "aprobado"]
    observadas = [s for s in secciones_ordenadas if s.estado == "observado"]
    entregadas = [s for s in secciones_ordenadas if s.estado == "entregado"]
    pendientes = [s for s in secciones_ordenadas if s.estado == "pendiente"]

    porcentaje_entrega = round((len(completadas) / total_obligatorias) * 100) if total_obligatorias else 0
    porcentaje_aprobacion = round((len(aprobadas) / total_obligatorias) * 100) if total_obligatorias else 0

    now = datetime.now(timezone.utc)
    fecha_limite = semestre.fecha_limite
    if fecha_limite and fecha_limite.tzinfo is None:
        fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
    vencida = bool(fecha_limite and now > fecha_limite and porcentaje_entrega < 100)

    db = object_session(carpeta)
    control = db.get(CicloCarpeta, carpeta.id) if db else None
    estado_ciclo = control.estado if control else "borrador"
    if estado_ciclo == "observada":
        estado_global = "observada"
    elif estado_ciclo == "aprobada":
        estado_global = "aprobada"
    elif estado_ciclo in ("enviada", "reenviada"):
        estado_global = "completa_en_revision"
    else:
        estado_global = "en_progreso"

    return {
        "id": carpeta.id,
        "estado_ciclo": estado_ciclo,
        "bloqueada": estado_ciclo in ("enviada", "reenviada", "aprobada"),
        "asignacion_id": asignacion.id,
        "seccion": asignacion.seccion,
        "fecha_actualizacion": iso_utc(carpeta.ultima_actualizacion),
        "docente": {
            "id": docente.id,
            "nombre": docente.nombre,
            "email": docente.email,
            "escuela": docente.escuela,
            "categoria": docente.categoria,
        },
        "curso": {
            "id": curso.id,
            "codigo": curso.codigo,
            "nombre": curso.nombre,
            "escuela": curso.escuela,
            "ciclo": curso.ciclo,
        },
        "semestre": {
            "id": semestre.id,
            "nombre": semestre.nombre,
            "inicio": semestre.inicio.isoformat(),
            "fin": semestre.fin.isoformat(),
            "fecha_limite": iso_utc(semestre.fecha_limite),
            "activo": semestre.activo,
        },
        "metricas": {
            "total_secciones": len(secciones_ordenadas),
            "total_obligatorias": total_obligatorias,
            "completadas_obligatorias": len(completadas),
            "aprobadas": len(aprobadas),
            "entregadas": len(entregadas),
            "observadas": len(observadas),
            "pendientes": len(pendientes),
            "porcentaje_avance": porcentaje_entrega,
            "porcentaje_aprobacion": porcentaje_aprobacion,
            "vencida": vencida,
            "estado_global": estado_global,
        },
    }


def serialize_carpeta_detail(carpeta: Carpeta) -> dict:
    from app.ciclo import consultar

    summary = serialize_carpeta_summary(carpeta)
    summary["ciclo"] = consultar(object_session(carpeta), carpeta)
    secciones_ordenadas = sorted(carpeta.secciones, key=lambda s: s.plantilla.orden)

    secciones_data = []
    for sec in secciones_ordenadas:
        docs_data = [
            {
                "id": d.id,
                "nombre": d.nombre,
                "tamano_mb": d.tamano_mb,
                "version": d.version,
                "subido_por": d.autor.nombre if d.autor else "Docente",
                "fecha": iso_utc(d.fecha),
            }
            for d in sec.documentos
        ]
        obs_data = [
            {
                "id": o.id,
                "texto": o.texto,
                "resuelta": o.resuelta,
                "revisor_nombre": o.revisor.nombre if o.revisor else "Revisor",
                "fecha": iso_utc(o.fecha),
            }
            for o in sec.observaciones
        ]
        secciones_data.append(
            {
                "id": sec.id,
                "estado": sec.estado,
                "plantilla": {
                    "id": sec.plantilla.id,
                    "orden": sec.plantilla.orden,
                    "nombre": sec.plantilla.nombre,
                    "descripcion": sec.plantilla.descripcion,
                    "obligatoria": sec.plantilla.obligatoria,
                    "tipos_permitidos": sec.plantilla.tipos_permitidos,
                },
                "documentos": docs_data,
                "observaciones": obs_data,
            }
        )

    historial_data = [
        {
            "id": h.id,
            "accion": h.accion,
            "detalle": h.detalle,
            "usuario_nombre": h.usuario.nombre if h.usuario else "Sistema",
            "usuario_rol": h.usuario.rol if h.usuario else "sistema",
            "fecha": iso_utc(h.fecha),
        }
        for h in carpeta.historial
    ]

    summary["secciones"] = secciones_data
    summary["historial"] = historial_data
    return summary
