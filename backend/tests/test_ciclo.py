from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Asignacion, Carpeta, CarpetaSeccion, Curso, Documento, HistorialAccion, PlantillaSeccion, Semestre, Usuario
from app import ciclo


class CicloTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        event.listen(self.engine, "connect", lambda connection, _: connection.execute("PRAGMA foreign_keys=ON"))
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.files = TemporaryDirectory(prefix=".ciclo-", dir=Path(__file__).parent)
        self.root = Path(self.files.name)
        self.docente = Usuario(nombre="Docente", email="d@example.test", password_hash="test", rol="docente", escuela="Sistemas")
        self.director = Usuario(nombre="Director", email="r@example.test", password_hash="test", rol="revisor", escuela="Sistemas")
        self.otro = Usuario(nombre="Otro", email="o@example.test", password_hash="test", rol="docente", escuela="Sistemas")
        curso = Curso(codigo="SIS-01", nombre="Curso ficticio", escuela="Sistemas", ciclo=1)
        semestre = Semestre(nombre="2026-II", inicio=date(2026, 8, 1), fin=date(2026, 12, 1), fecha_limite=datetime(2026, 12, 1, tzinfo=timezone.utc))
        self.db.add_all([self.docente, self.director, self.otro, curso, semestre])
        self.db.flush()
        asignacion = Asignacion(docente_id=self.docente.id, curso_id=curso.id, semestre_id=semestre.id, seccion="A")
        self.carpeta = Carpeta(asignacion=asignacion)
        self.db.add(self.carpeta)
        for orden, nombre in [(1, "Sílabo"), (3, "Plan de sesiones"), (4, "Asistencia"), (9, "Informe final")]:
            plantilla = PlantillaSeccion(nombre=nombre, orden=orden, obligatoria=True, tipos_permitidos="pdf,docx,xlsx")
            self.db.add(CarpetaSeccion(carpeta=self.carpeta, plantilla=plantilla))
        self.db.commit()
        ciclo.inicializar(self.db)
        self.hitos = ciclo.consultar(self.db, self.carpeta)["hitos"]

    def tearDown(self):
        self.db.close()
        self.engine.dispose()
        self.files.cleanup()

    def cargar(self, seccion, content=b"%PDF-1.4\nmock\n%%EOF"):
        return ciclo.cargar(self.db, seccion.id, self.docente, "evidencia.pdf", content, self.root)

    def completar(self, hito):
        for seccion in self.carpeta.secciones:
            if seccion.plantilla_id in hito["item_ids"] and not seccion.documentos:
                self.cargar(seccion)

    def enviar(self, index=0):
        return ciclo.enviar(self.db, self.carpeta.id, self.hitos[index]["id"], self.docente, self.root)

    def evaluar(self, entrega, estado="aprobado", comentario=None):
        for detalle in entrega.detalles:
            ciclo.evaluar(self.db, entrega.id, detalle.id, self.director, estado, comentario)

    def test_inicio_does_not_require_final_documents_and_locks_uploads(self):
        with self.assertRaises(ciclo.ErrorCiclo):
            self.enviar()
        self.completar(self.hitos[0])
        entrega = self.enviar()
        self.assertEqual(entrega.estado, "pendiente")
        self.assertEqual(ciclo.consultar(self.db, self.carpeta)["estado"], "enviada")
        with self.assertRaises(ciclo.ErrorCiclo):
            self.cargar(self.carpeta.secciones[0])
        with self.assertRaises(ciclo.ErrorCiclo):
            self.enviar()

    def test_observation_correction_resubmission_keeps_original_snapshot(self):
        self.completar(self.hitos[0])
        entrega = self.enviar()
        original = entrega.detalles[0].documento_id
        self.evaluar(entrega, "observado", "Corregir el contenido")
        ciclo.concluir(self.db, entrega.id, self.director)
        self.assertEqual(ciclo.consultar(self.db, self.carpeta)["estado"], "observada")
        self.cargar(self.carpeta.secciones[0], b"%PDF-1.4\ncorreccion\n%%EOF")
        self.assertIsNone(entrega.detalles[0].subsanada_en_entrega_id)
        self.assertEqual(entrega.detalles[0].documento_id, original)
        reenvio = self.enviar()
        self.assertEqual(reenvio.numero, 2)
        self.assertEqual(ciclo.consultar(self.db, self.carpeta)["estado"], "reenviada")
        self.evaluar(reenvio)
        ciclo.concluir(self.db, reenvio.id, self.director)
        self.assertEqual(entrega.detalles[0].subsanada_en_entrega_id, reenvio.id)
        self.assertEqual(ciclo.consultar(self.db, self.carpeta)["estado"], "en_progreso")

    def test_final_can_skip_partials_but_requires_all_items(self):
        self.completar(self.hitos[0])
        with self.assertRaises(ciclo.ErrorCiclo):
            self.enviar(2)
        self.completar(self.hitos[2])
        entrega = self.enviar(2)
        self.evaluar(entrega)
        ciclo.concluir(self.db, entrega.id, self.director)
        self.assertEqual(ciclo.consultar(self.db, self.carpeta)["estado"], "aprobada")
        with self.assertRaises(ciclo.ErrorCiclo):
            self.cargar(self.carpeta.secciones[0])
        with self.assertRaises(ciclo.ErrorCiclo):
            self.enviar()

    def test_incomplete_evaluation_and_empty_comment_do_not_conclude(self):
        self.completar(self.hitos[0])
        entrega = self.enviar()
        with self.assertRaises(ciclo.ErrorCiclo):
            ciclo.evaluar(self.db, entrega.id, entrega.detalles[0].id, self.director, "observado", "  ")
        with self.assertRaises(ciclo.ErrorCiclo):
            ciclo.concluir(self.db, entrega.id, self.director)
        self.assertEqual(entrega.estado, "pendiente")
        self.assertTrue(ciclo.consultar(self.db, self.carpeta)["bloqueada"])

    def test_late_submission_allowed_and_deadline_is_snapshotted(self):
        self.completar(self.hitos[0])
        hito = self.db.get(ciclo.HitoEntrega, self.hitos[0]["id"])
        hito.fecha_limite = datetime.now(timezone.utc) - timedelta(days=1)
        self.db.commit()
        entrega = self.enviar()
        self.assertTrue(entrega.tardia)
        original = entrega.fecha_limite
        hito.fecha_limite = datetime.now(timezone.utc) + timedelta(days=1)
        self.db.commit()
        self.assertEqual(entrega.fecha_limite, original)

    def test_ownership_and_school_are_enforced_and_self_review_allowed(self):
        self.completar(self.hitos[0])
        with self.assertRaises(ciclo.ErrorCiclo):
            ciclo.enviar(self.db, self.carpeta.id, self.hitos[0]["id"], self.otro, self.root)
        self.carpeta.asignacion.docente_id = self.director.id
        self.db.commit()
        entrega = ciclo.enviar(self.db, self.carpeta.id, self.hitos[0]["id"], self.director, self.root)
        self.director.escuela = "Otra escuela"
        self.db.commit()
        with self.assertRaises(ciclo.ErrorCiclo):
            ciclo.evaluar(self.db, entrega.id, entrega.detalles[0].id, self.director, "aprobado")
        self.director.escuela = "Sistemas"
        self.db.commit()
        self.evaluar(entrega)
        ciclo.concluir(self.db, entrega.id, self.director)
        self.assertEqual(entrega.estado, "aprobada")

    def test_initialization_is_idempotent_and_preserves_existing_data(self):
        self.cargar(self.carpeta.secciones[0])
        before = self.db.query(Documento).count(), self.db.query(HistorialAccion).count()
        ciclo.inicializar(self.db)
        self.assertEqual(self.db.query(ciclo.HitoEntrega).count(), 3)
        self.assertEqual(before, (self.db.query(Documento).count(), self.db.query(HistorialAccion).count()))

    def test_missing_file_rejects_submission_without_history_or_lock(self):
        self.completar(self.hitos[0])
        doc = self.carpeta.secciones[0].documentos[0]
        (self.root / doc.ruta).unlink()
        history = self.db.query(HistorialAccion).count()
        with self.assertRaises(ciclo.ErrorCiclo):
            self.enviar()
        self.assertEqual(self.db.query(HistorialAccion).count(), history)
        self.assertFalse(ciclo.consultar(self.db, self.carpeta)["bloqueada"])

    def test_failed_upload_commit_rolls_back_file_document_and_history(self):
        with patch.object(self.db, "commit", side_effect=RuntimeError("fallo simulado")):
            with self.assertRaises(RuntimeError):
                self.cargar(self.carpeta.secciones[0])
        self.assertEqual(self.db.query(Documento).count(), 0)
        self.assertEqual(self.db.query(HistorialAccion).count(), 0)
        self.assertEqual(list(self.root.rglob("*.pdf")), [])

    def test_stale_writer_cannot_send_with_old_cycle_version(self):
        self.completar(self.hitos[0])
        control = self.db.get(ciclo.CicloCarpeta, self.carpeta.id)
        with Session(self.engine) as concurrente:
            otro_control = concurrente.get(ciclo.CicloCarpeta, self.carpeta.id)
            otro_control.version += 1
            concurrente.commit()
        with self.assertRaises(ciclo.ErrorCiclo):
            self.enviar()
        self.assertEqual(self.db.query(ciclo.Entrega).count(), 0)
        self.assertFalse(ciclo.consultar(self.db, self.carpeta)["bloqueada"])
