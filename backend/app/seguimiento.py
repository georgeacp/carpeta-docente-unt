"""Indicadores de presentación formal separados de la carga de documentos."""
from datetime import datetime, timezone

from app.configuracion import utc
from app.db.ciclo import Entrega, HitoEntrega


def indicadores(db, carpeta, estado):
    entregas = db.query(Entrega).filter_by(carpeta_id=carpeta.id).all()
    presentados = {e.hito_id for e in entregas}
    hitos = db.query(HitoEntrega).filter_by(curso_id=carpeta.asignacion.curso_id, semestre_id=carpeta.asignacion.semestre_id).all()
    ahora = datetime.now(timezone.utc)
    return {
        "entregas_presentadas": len(entregas),
        "entregas_tardias": sum(e.tardia for e in entregas),
        "hitos_vencidos_sin_presentacion": 0 if estado == "aprobada" else sum(h.id not in presentados and utc(h.fecha_limite) < ahora for h in hitos),
        "pendiente_revision": any(e.estado == "pendiente" for e in entregas),
    }


def filtrar(items, estado=None, q=None):
    if estado and estado != "todos":
        items = [i for i in items if i["metricas"]["estado_global"] == estado or i["estado_ciclo"] == estado]
    if q:
        texto = q.strip().casefold()
        items = [i for i in items if texto in " ".join((i["curso"]["codigo"], i["curso"]["nombre"], i["docente"]["nombre"], i["docente"]["email"])).casefold()]
    return items
