"""Configuración compartida por curso y semestre; se congela al cargar evidencia."""
import json
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm.exc import StaleDataError

from app.db.ciclo import CambioConfiguracion, ConfiguracionCurso, Entrega, HitoEntrega, RequisitoHito
from app.db.models import Asignacion, Carpeta, CarpetaSeccion, Curso, Documento, PlantillaSeccion, Semestre

HITOS = (("inicio", "Inicio", 1), ("seguimiento", "Seguimiento", 2), ("cierre", "Cierre integral", 3))


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def referencias(db, curso_id, semestre_id):
    from app.ciclo import ErrorCiclo
    curso, semestre = db.get(Curso, curso_id), db.get(Semestre, semestre_id)
    if curso is None or semestre is None:
        raise ErrorCiclo("Curso o semestre no encontrado.", 404)
    return curso, semestre


def predeterminados(db, semestre):
    plantillas = db.query(PlantillaSeccion).order_by(PlantillaSeccion.orden).all()
    resultado = []
    duracion = max(0, (semestre.fin - semestre.inicio).days)
    for codigo, nombre, orden in HITOS:
        dias = min(14, duracion // 2) if codigo == "inicio" else duracion // 2
        fecha = datetime.combine(semestre.inicio + timedelta(days=dias), time(23, 59, 59), ZoneInfo("America/Lima"))
        if codigo == "cierre":
            fecha = utc(semestre.fecha_limite)
        items = []
        for plantilla in plantillas:
            titulo = plantilla.nombre.lower()
            if codigo == "inicio" and not any(p in titulo for p in ("sílabo", "silabo", "plan de sesiones", "socializ", "delegad", "entrada", "carga horaria")):
                continue
            if codigo == "seguimiento" and any(p in titulo for p in ("informe final", "actas firmadas", "cierre")):
                continue
            items.append(plantilla.id)
        if not items and plantillas:
            items = [plantillas[0].id]
        resultado.append({"codigo": codigo, "nombre": nombre, "orden": orden, "fecha_limite": utc(fecha).isoformat(), "item_ids": items})
    return resultado


def tiene_evidencia(db, curso_id, semestre_id):
    carpetas = db.query(Carpeta.id).join(Asignacion).filter(Asignacion.curso_id == curso_id, Asignacion.semestre_id == semestre_id)
    documentos = db.query(Documento.id).join(CarpetaSeccion).filter(CarpetaSeccion.carpeta_id.in_(carpetas))
    return documentos.first() is not None or db.query(Entrega.id).filter(Entrega.carpeta_id.in_(carpetas)).first() is not None


def asegurar(db, curso_id, semestre_id):
    """Solo desde transacciones de escritura o inicialización; nunca desde GET."""
    _, semestre = referencias(db, curso_id, semestre_id)
    control = db.get(ConfiguracionCurso, (curso_id, semestre_id))
    if control is None:
        control = ConfiguracionCurso(curso_id=curso_id, semestre_id=semestre_id, bloqueada=tiene_evidencia(db, curso_id, semestre_id))
        db.add(control)
        db.flush()
    elif not control.bloqueada and tiene_evidencia(db, curso_id, semestre_id):
        control.bloqueada = True
    for dato in predeterminados(db, semestre):
        hito = db.query(HitoEntrega).filter_by(curso_id=curso_id, semestre_id=semestre_id, codigo=dato["codigo"]).first()
        if hito is None:
            hito = HitoEntrega(curso_id=curso_id, semestre_id=semestre_id, codigo=dato["codigo"], nombre=dato["nombre"], orden=dato["orden"], fecha_limite=datetime.fromisoformat(dato["fecha_limite"]))
            db.add(hito)
            db.flush()
            for item in dato["item_ids"]:
                db.add(RequisitoHito(hito_id=hito.id, plantilla_id=item))
    db.flush()
    return control


def consultar(db, curso_id, semestre_id):
    _, semestre = referencias(db, curso_id, semestre_id)
    control = db.get(ConfiguracionCurso, (curso_id, semestre_id))
    hitos = db.query(HitoEntrega).filter_by(curso_id=curso_id, semestre_id=semestre_id).order_by(HitoEntrega.orden).all()
    datos = [{"codigo": h.codigo, "nombre": h.nombre, "fecha_limite": utc(h.fecha_limite).isoformat(), "item_ids": [r.plantilla_id for r in h.requisitos]} for h in hitos] if hitos else predeterminados(db, semestre)
    bloqueada = bool(control and control.bloqueada) or tiene_evidencia(db, curso_id, semestre_id)
    return {"curso_id": curso_id, "semestre_id": semestre_id, "version": control.version if control else 0, "bloqueada": bloqueada, "motivo_bloqueo": "Ya existen documentos o entregas en este curso y semestre." if bloqueada else None, "hitos": datos}


def guardar(db, curso_id, semestre_id, payload, usuario):
    from app.ciclo import ErrorCiclo
    try:
        _, semestre = referencias(db, curso_id, semestre_id)
        control = db.query(ConfiguracionCurso).filter_by(curso_id=curso_id, semestre_id=semestre_id).with_for_update().one_or_none()
        anterior = consultar(db, curso_id, semestre_id)
        if anterior["bloqueada"]:
            raise ErrorCiclo(anterior["motivo_bloqueo"])
        if payload.version != (control.version if control else 0):
            raise ErrorCiclo("La configuración cambió. Actualice antes de guardar.")
        datos = {h.codigo: h for h in payload.hitos}
        if len(payload.hitos) != 3 or set(datos) != {c for c, _, _ in HITOS}:
            raise ErrorCiclo("Configure exactamente inicio, seguimiento y cierre.", 400)
        plantillas = {p.id: p for p in db.query(PlantillaSeccion).all()}
        anterior_fecha = datetime.combine(semestre.inicio, time.min, ZoneInfo("America/Lima"))
        for codigo, _, _ in HITOS:
            hito = datos[codigo]
            if not hito.item_ids or len(hito.item_ids) != len(set(hito.item_ids)) or not set(hito.item_ids) <= plantillas.keys():
                raise ErrorCiclo("Seleccione requisitos existentes y sin duplicados para cada hito.", 400)
            if hito.fecha_limite < anterior_fecha:
                raise ErrorCiclo("Las fechas deben estar ordenadas desde el inicio del semestre.", 400)
            anterior_fecha = hito.fecha_limite
        obligatorios = {p.id for p in plantillas.values() if p.obligatoria}
        if not obligatorios <= set(datos["cierre"].item_ids):
            raise ErrorCiclo("El cierre debe incluir todos los ítems obligatorios.", 400)
        if control is None:
            control = asegurar(db, curso_id, semestre_id)
        else:
            control.version += 1
            db.flush()
        for hito in db.query(HitoEntrega).filter_by(curso_id=curso_id, semestre_id=semestre_id).all():
            nuevo = datos[hito.codigo]
            hito.fecha_limite = nuevo.fecha_limite.astimezone(timezone.utc)
            db.query(RequisitoHito).filter_by(hito_id=hito.id).delete(synchronize_session=False)
            for item in nuevo.item_ids:
                db.add(RequisitoHito(hito_id=hito.id, plantilla_id=item))
            db.expire(hito, ["requisitos"])
        db.flush()
        nueva = consultar(db, curso_id, semestre_id)
        db.add(CambioConfiguracion(curso_id=curso_id, semestre_id=semestre_id, usuario_id=usuario.id, fecha=datetime.now(timezone.utc), anterior=json.dumps(anterior, ensure_ascii=False), nueva=json.dumps(nueva, ensure_ascii=False)))
        db.commit()
        return nueva
    except (IntegrityError, OperationalError, StaleDataError) as error:
        db.rollback()
        raise ErrorCiclo("La configuración cambió durante la operación. Actualice e inténtelo nuevamente.") from error
    except Exception:
        db.rollback()
        raise


def bloquear_por_carga(db, carpeta):
    asignacion = carpeta.asignacion
    control = db.query(ConfiguracionCurso).filter_by(curso_id=asignacion.curso_id, semestre_id=asignacion.semestre_id).with_for_update().one()
    control.version += 1
    control.bloqueada = True
    db.flush()
