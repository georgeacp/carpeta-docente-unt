"""Module de ciclo de carpeta: una interface para carga, entrega y dictamen.

Cada escritura bloquea el ciclo y confirma estado e historial juntos. Los detalles
de una entrega conservan la evidencia presentada; la evaluación solo cambia
mientras la entrega está pendiente.
"""
from contextlib import contextmanager
from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm.exc import StaleDataError

from app.db.ciclo import CicloCarpeta, DetalleEntrega, Entrega, HitoEntrega, RequisitoHito
from app.db.models import Carpeta, CarpetaSeccion, Documento, HistorialAccion, PlantillaSeccion


class ErrorCiclo(ValueError):
    def __init__(self, mensaje, status_code=409):
        super().__init__(mensaje)
        self.status_code = status_code


def _utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def autorizar(carpeta, usuario, *, propietario=False, director=False):
    if not usuario.activo:
        raise ErrorCiclo("Usuario inactivo.", 403)
    if director:
        permitido = usuario.rol == "revisor" and usuario.escuela == carpeta.asignacion.curso.escuela
    elif propietario:
        permitido = usuario.id == carpeta.asignacion.docente_id and usuario.rol in ("docente", "revisor")
    else:
        permitido = usuario.id == carpeta.asignacion.docente_id or (
            usuario.rol == "revisor" and usuario.escuela == carpeta.asignacion.curso.escuela
        )
    if not permitido:
        raise ErrorCiclo("No tiene permisos sobre esta carpeta.", 403)


def _carpeta(db, carpeta_id):
    carpeta = db.get(Carpeta, carpeta_id)
    if carpeta is None:
        raise ErrorCiclo("Carpeta no encontrada.", 404)
    return carpeta


@contextmanager
def _cambio(db, carpeta_id):
    try:
        control = db.query(CicloCarpeta).filter_by(carpeta_id=carpeta_id).with_for_update().one_or_none()
        if control is None:
            raise ErrorCiclo("El ciclo de esta carpeta aún no está inicializado.")
        control.version += 1
        db.flush()  # Adquiere escritura en SQLite y comprueba versión en ambos motores.
        yield control
        db.commit()
    except (IntegrityError, OperationalError, StaleDataError) as error:
        db.rollback()
        raise ErrorCiclo("La carpeta cambió durante la operación. Actualice e inténtelo nuevamente.") from error
    except Exception:
        db.rollback()
        raise


def _historial(db, carpeta, usuario, accion, detalle):
    carpeta.ultima_actualizacion = datetime.now(timezone.utc)
    db.add(HistorialAccion(carpeta_id=carpeta.id, usuario_id=usuario.id, accion=accion, detalle=detalle))


def inicializar(db):
    """Inicialización aditiva e idempotente: no inventa envíos históricos."""
    plantillas = db.query(PlantillaSeccion).order_by(PlantillaSeccion.orden).all()
    for carpeta in db.query(Carpeta).all():
        if db.get(CicloCarpeta, carpeta.id) is None:
            db.add(CicloCarpeta(carpeta_id=carpeta.id))
        asignacion = carpeta.asignacion
        semestre = asignacion.semestre
        for codigo, nombre, orden in [("inicio", "Inicio", 1), ("seguimiento", "Seguimiento", 2), ("cierre", "Cierre integral", 3)]:
            existente = db.query(HitoEntrega).filter_by(curso_id=asignacion.curso_id, semestre_id=asignacion.semestre_id, codigo=codigo).first()
            if existente:
                continue
            dias = 14 if codigo == "inicio" else max(0, (semestre.fin - semestre.inicio).days // 2)
            fecha = datetime.combine(semestre.inicio + timedelta(days=dias), time(23, 59, 59), ZoneInfo("America/Lima"))
            if codigo == "cierre":
                fecha = _utc(semestre.fecha_limite)
            hito = HitoEntrega(curso_id=asignacion.curso_id, semestre_id=asignacion.semestre_id, codigo=codigo, nombre=nombre, orden=orden, fecha_limite=fecha)
            db.add(hito)
            db.flush()
            # Configuración demostrativa inicial; cada oferta conserva sus requisitos.
            seleccion = []
            for plantilla in plantillas:
                nombre_item = plantilla.nombre.lower()
                if codigo == "inicio" and not any(palabra in nombre_item for palabra in ("sílabo", "silabo", "plan de sesiones", "socializ", "delegad", "entrada", "carga horaria")):
                    continue
                if codigo == "seguimiento" and any(palabra in nombre_item for palabra in ("informe final", "actas firmadas", "cierre")):
                    continue
                seleccion.append(plantilla.id)
            if not seleccion and plantillas:
                seleccion = [plantillas[0].id]
            for plantilla_id in seleccion:
                db.add(RequisitoHito(hito_id=hito.id, plantilla_id=plantilla_id))
    db.commit()


def consultar(db, carpeta):
    control = db.get(CicloCarpeta, carpeta.id)
    estado = control.estado if control else "borrador"
    hitos = db.query(HitoEntrega).filter_by(curso_id=carpeta.asignacion.curso_id, semestre_id=carpeta.asignacion.semestre_id).order_by(HitoEntrega.orden).all()
    entregas = db.query(Entrega).filter_by(carpeta_id=carpeta.id).order_by(Entrega.id.desc()).all()
    return {
        "estado": estado,
        "bloqueada": estado in ("enviada", "reenviada", "aprobada"),
        "hitos": [{"id": h.id, "codigo": h.codigo, "nombre": h.nombre, "fecha_limite": _utc(h.fecha_limite).isoformat(), "item_ids": [r.plantilla_id for r in h.requisitos]} for h in hitos],
        "entregas": [{
            "id": e.id, "hito_id": e.hito_id, "hito": e.hito.nombre, "numero": e.numero, "estado": e.estado,
            "enviada_en": _utc(e.enviada_en).isoformat(), "fecha_limite": _utc(e.fecha_limite).isoformat(), "tardia": e.tardia,
            "director_id": e.director_id, "dictaminada_en": _utc(e.dictaminada_en).isoformat() if e.dictaminada_en else None,
            "detalles": [{"id": d.id, "seccion_id": d.seccion_id, "documento_id": d.documento_id, "titulo": d.titulo, "nombre": d.nombre, "version": d.version, "obligatorio": d.obligatorio, "dictamen": d.dictamen, "comentario": d.comentario, "subsanada_en_entrega_id": d.subsanada_en_entrega_id} for d in e.detalles],
        } for e in entregas],
    }


def cargar(db, seccion_id, usuario, nombre, contenido, storage):
    seccion = db.get(CarpetaSeccion, seccion_id)
    if seccion is None:
        raise ErrorCiclo("Ítem no encontrado.", 404)
    carpeta = seccion.carpeta
    autorizar(carpeta, usuario, propietario=True)
    extension = Path(nombre).suffix.lower().lstrip(".")
    permitidos = set((seccion.plantilla.tipos_permitidos or "pdf,docx,xlsx").split(",")) & {"pdf", "docx", "xlsx"}
    if extension not in permitidos or not contenido:
        raise ErrorCiclo("Seleccione un archivo no vacío en formato PDF, DOCX o XLSX permitido por el ítem.", 400)
    ruta = f"carpetas/{carpeta.id}/{uuid4().hex}.{extension}"
    archivo = Path(storage) / ruta
    creado = False
    try:
        with _cambio(db, carpeta.id) as control:
            db.refresh(seccion)
            db.expire(seccion, ["documentos"])
            if control.estado in ("enviada", "reenviada", "aprobada"):
                raise ErrorCiclo("La carpeta está bloqueada durante la revisión o después de su aprobación final.")
            version = max((d.version for d in seccion.documentos), default=0) + 1
            archivo.parent.mkdir(parents=True, exist_ok=True)
            with archivo.open("xb") as destino:
                creado = True
                destino.write(contenido)
            documento = Documento(carpeta_seccion_id=seccion.id, nombre=Path(nombre).name[:255], ruta=ruta, tamano_mb=len(contenido) / (1024 * 1024), version=version, subido_por=usuario.id)
            db.add(documento)
            # La corrección conserva la observación hasta el dictamen del Director.
            if seccion.estado != "observado":
                seccion.estado = "entregado"
            _historial(db, carpeta, usuario, "DOCUMENTO_SUBIDO", f"Cargó {documento.nombre}, versión {version}. No constituye un envío formal.")
        return documento
    except Exception:
        if creado:
            archivo.unlink(missing_ok=True)
        raise


def enviar(db, carpeta_id, hito_id, usuario, storage):
    carpeta = _carpeta(db, carpeta_id)
    autorizar(carpeta, usuario, propietario=True)
    with _cambio(db, carpeta_id) as control:
        db.expire(carpeta, ["secciones"])
        if control.estado in ("enviada", "reenviada", "aprobada"):
            raise ErrorCiclo("La carpeta tiene una revisión pendiente o ya está aprobada.")
        hito = db.get(HitoEntrega, hito_id)
        if hito is None or (hito.curso_id, hito.semestre_id) != (carpeta.asignacion.curso_id, carpeta.asignacion.semestre_id):
            raise ErrorCiclo("El hito no pertenece al curso y semestre de la carpeta.", 400)
        anteriores = db.query(Entrega).filter_by(carpeta_id=carpeta_id, hito_id=hito_id).order_by(Entrega.numero.desc()).all()
        if anteriores and anteriores[0].estado == "aprobada":
            raise ErrorCiclo("Este hito ya tiene una entrega aprobada. Continúe con otro hito.")
        otra_observada = db.query(Entrega).filter_by(carpeta_id=carpeta_id, estado="observada").order_by(Entrega.id.desc()).first()
        # El cierre puede omitir parciales; un parcial observado se corrige antes de otro parcial.
        if control.estado == "observada" and otra_observada and otra_observada.hito_id != hito_id and hito.codigo != "cierre":
            raise ErrorCiclo("Reenvíe el hito observado o presente el cierre integral.")
        item_ids = {r.plantilla_id for r in hito.requisitos}
        secciones = [s for s in carpeta.secciones if s.plantilla_id in item_ids or hito.codigo == "cierre"]
        for seccion in secciones:
            db.expire(seccion, ["documentos"])
        if not secciones:
            raise ErrorCiclo("El hito no tiene requisitos configurados.", 400)
        faltantes = [s.plantilla.nombre for s in secciones if s.plantilla.obligatoria and not s.documentos]
        if faltantes:
            raise ErrorCiclo("Faltan documentos obligatorios: " + "; ".join(faltantes), 400)
        vigentes = [(s, max(s.documentos, key=lambda d: d.version)) for s in secciones if s.documentos]
        if not vigentes:
            raise ErrorCiclo("La entrega debe incluir al menos un documento.", 400)
        if any(not (Path(storage) / d.ruta).is_file() for _, d in vigentes):
            raise ErrorCiclo("Un archivo no está disponible. Reponga la evidencia antes de enviar.")
        ahora = datetime.now(timezone.utc)
        entrega = Entrega(carpeta_id=carpeta_id, hito_id=hito_id, numero=(anteriores[0].numero + 1 if anteriores else 1), pendiente_carpeta_id=carpeta_id, enviada_por=usuario.id, enviada_en=ahora, fecha_limite=_utc(hito.fecha_limite), tardia=ahora > _utc(hito.fecha_limite))
        db.add(entrega)
        db.flush()
        for seccion, doc in vigentes:
            db.add(DetalleEntrega(entrega_id=entrega.id, seccion_id=seccion.id, documento_id=doc.id, titulo=seccion.plantilla.nombre, nombre=doc.nombre, version=doc.version, obligatorio=seccion.plantilla.obligatoria))
        control.estado = "reenviada" if anteriores else "enviada"
        _historial(db, carpeta, usuario, "ENTREGA_REENVIADA" if anteriores else "ENTREGA_ENVIADA", f"{hito.nombre}, intento {entrega.numero}. " + ("Fuera de plazo." if entrega.tardia else "Dentro del plazo."))
    return entrega


def _pendiente(db, entrega_id, usuario):
    entrega = db.get(Entrega, entrega_id)
    if entrega is None:
        raise ErrorCiclo("Entrega no encontrada.", 404)
    carpeta = _carpeta(db, entrega.carpeta_id)
    autorizar(carpeta, usuario, director=True)
    return entrega, carpeta


def evaluar(db, entrega_id, detalle_id, usuario, dictamen, comentario=None):
    entrega, carpeta = _pendiente(db, entrega_id, usuario)
    with _cambio(db, carpeta.id):
        db.refresh(entrega)
        if entrega.estado != "pendiente":
            raise ErrorCiclo("La entrega ya fue dictaminada.")
        detalle = next((d for d in entrega.detalles if d.id == detalle_id), None)
        if detalle is None:
            raise ErrorCiclo("El documento no pertenece a esta entrega.", 404)
        if dictamen not in ("aprobado", "observado"):
            raise ErrorCiclo("Dictamen documental inválido.", 400)
        texto = (comentario or "").strip()
        if dictamen == "observado" and not texto:
            raise ErrorCiclo("La observación requiere una explicación.", 400)
        detalle.dictamen = dictamen
        detalle.comentario = texto or None
        detalle.evaluado_por = usuario.id
        _historial(db, carpeta, usuario, "EVALUACION_GUARDADA", f"Guardó evaluación de {detalle.titulo} en entrega {entrega.id}; dictamen integral pendiente.")
    return entrega


def concluir(db, entrega_id, usuario):
    entrega, carpeta = _pendiente(db, entrega_id, usuario)
    with _cambio(db, carpeta.id) as control:
        db.refresh(entrega)
        if entrega.estado != "pendiente":
            raise ErrorCiclo("La entrega ya fue dictaminada.")
        if not entrega.detalles or any(d.dictamen == "pendiente" for d in entrega.detalles):
            raise ErrorCiclo("Debe evaluar todos los documentos antes de concluir.", 400)
        for detalle in entrega.detalles:
            seccion = db.get(CarpetaSeccion, detalle.seccion_id)
            seccion.estado = detalle.dictamen
            if detalle.dictamen == "aprobado":
                for observacion in seccion.observaciones:
                    observacion.resuelta = True
                anteriores = db.query(DetalleEntrega).join(Entrega, DetalleEntrega.entrega_id == Entrega.id).filter(Entrega.carpeta_id == carpeta.id, Entrega.estado == "observada", DetalleEntrega.seccion_id == seccion.id, DetalleEntrega.dictamen == "observado", DetalleEntrega.subsanada_en_entrega_id.is_(None)).all()
                for anterior in anteriores:
                    anterior.subsanada_en_entrega_id = entrega.id
        entrega.estado = "observada" if any(d.dictamen == "observado" for d in entrega.detalles) else "aprobada"
        entrega.director_id = usuario.id
        entrega.dictaminada_en = datetime.now(timezone.utc)
        entrega.pendiente_carpeta_id = None
        if entrega.estado == "observada":
            control.estado = "observada"
        else:
            control.estado = "aprobada" if entrega.hito.codigo == "cierre" else "en_progreso"
        _historial(db, carpeta, usuario, "ENTREGA_DICTAMINADA", f"{entrega.hito.nombre}, intento {entrega.numero}: {entrega.estado}." + (" Autorrevisión del Director." if usuario.id == carpeta.asignacion.docente_id else ""))
    return entrega
