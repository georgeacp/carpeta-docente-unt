import os
import unittest
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import ciclo, configuracion
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.ciclo import CambioConfiguracion, ConfiguracionCurso, HitoEntrega
from app.db.models import Asignacion, Carpeta, CarpetaSeccion, Documento, Semestre
from app.routers import admin, carpetas, revision
import test_ciclo as fixtures


class ConfiguracionTest(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.CicloTest()
        self.fixture.setUp()
        self.db = self.fixture.db
        self.admin = self.fixture.otro
        self.admin.rol = "admin"
        self.db.commit()
        self.usuario = self.admin
        asignacion = self.fixture.carpeta.asignacion
        self.curso, self.semestre = asignacion.curso_id, asignacion.semestre_id
        self.url = f"/api/admin/cursos/{self.curso}/semestres/{self.semestre}/configuracion"
        app = FastAPI()
        for router in (admin.router, carpetas.router, revision.router):
            app.include_router(router)

        @app.exception_handler(ciclo.ErrorCiclo)
        async def error(request, exc):
            return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})

        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: self.usuario
        self.client = TestClient(app)
        self.config = self.client.get(self.url).json()

    def tearDown(self):
        self.client.close()
        self.fixture.tearDown()

    def save(self, data=None):
        return self.client.put(self.url, json=data or self.config)

    def test_configuration_saved_atomically_and_audited(self):
        self.config["hitos"][0]["item_ids"] = [self.fixture.carpeta.secciones[0].plantilla_id]
        response = self.save()
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["version"], self.config["version"] + 1)
        self.assertEqual(response.json()["hitos"][0]["item_ids"], self.config["hitos"][0]["item_ids"])
        audit = self.db.query(CambioConfiguracion).one()
        self.assertEqual(audit.usuario_id, self.admin.id)
        self.assertNotEqual(audit.anterior, audit.nueva)
        self.assertEqual(self.save().status_code, 409)
        self.assertEqual(self.db.query(CambioConfiguracion).count(), 1)

    def test_invalid_requirements_dates_and_closure_leave_configuration_unchanged(self):
        for change in ("item", "duplicates", "missing", "closure", "date", "naive", "before"):
            data = deepcopy(self.config)
            if change == "item": data["hitos"][0]["item_ids"] = [99999]
            if change == "duplicates": data["hitos"][0]["item_ids"] *= 2
            if change == "missing": data["hitos"] = data["hitos"][:2]
            if change == "closure": data["hitos"][2]["item_ids"] = data["hitos"][0]["item_ids"]
            if change == "date": data["hitos"][0]["fecha_limite"] = "2099-01-01T00:00:00Z"
            if change == "naive": data["hitos"][0]["fecha_limite"] = "2026-08-20T23:59:00"
            if change == "before": data["hitos"][0]["fecha_limite"] = "2026-08-01T00:00:00Z"
            with self.subTest(change=change):
                self.assertIn(self.save(data).status_code, (400, 422))
                self.assertEqual(self.client.get(self.url).json(), self.config)
        self.assertEqual(self.db.query(CambioConfiguracion).count(), 0)

    def test_first_successful_upload_locks_all_sections_of_same_course(self):
        asignacion = Asignacion(docente_id=self.fixture.docente.id, curso_id=self.curso, semestre_id=self.semestre, seccion="B")
        carpeta = Carpeta(asignacion=asignacion)
        self.db.add(carpeta)
        self.db.commit()
        ciclo.inicializar(self.db)
        self.fixture.cargar(self.fixture.carpeta.secciones[0])
        self.assertTrue(self.client.get(self.url).json()["bloqueada"])
        self.assertEqual(self.save().status_code, 409)
        self.assertEqual([h["id"] for h in ciclo.consultar(self.db, carpeta)["hitos"]], [h["id"] for h in self.fixture.hitos])

    def test_failed_upload_does_not_lock_configuration(self):
        with self.assertRaises(ciclo.ErrorCiclo):
            self.fixture.cargar(self.fixture.carpeta.secciones[0], b"")
        with patch.object(self.db, "commit", side_effect=RuntimeError("Fallo ficticio")):
            with self.assertRaises(RuntimeError):
                self.fixture.cargar(self.fixture.carpeta.secciones[0])
        self.assertFalse(self.client.get(self.url).json()["bloqueada"])
        self.assertEqual(self.db.query(Documento).count(), 0)
        self.assertEqual(self.save().status_code, 200)

    def test_legacy_evidence_initialization_is_idempotent(self):
        self.fixture.cargar(self.fixture.carpeta.secciones[0])
        control = self.db.get(ConfiguracionCurso, (self.curso, self.semestre))
        self.db.delete(control)
        self.db.commit()
        ciclo.inicializar(self.db)
        original = self.client.get(self.url).json()
        ciclo.inicializar(self.db)
        self.assertEqual(self.client.get(self.url).json(), original)
        self.assertTrue(original["bloqueada"])

    def test_can_configure_before_assignments_without_get_writes(self):
        semestre = Semestre(nombre="QA-FUTURO", inicio=datetime(2028, 1, 1).date(), fin=datetime(2028, 7, 1).date(), fecha_limite=datetime(2028, 7, 2, tzinfo=timezone.utc))
        self.db.add(semestre)
        self.db.commit()
        url = f"/api/admin/cursos/{self.curso}/semestres/{semestre.id}/configuracion"
        data = self.client.get(url).json()
        self.assertEqual(data["version"], 0)
        self.assertIsNone(self.db.get(ConfiguracionCurso, (self.curso, semestre.id)))
        saved = self.client.put(url, json=data)
        self.assertEqual(saved.status_code, 200, saved.text)
        self.assertEqual(saved.json()["version"], 1)

    def test_stale_upload_cannot_race_configuration_update(self):
        with Session(self.fixture.engine, expire_on_commit=False) as stale:
            cached = stale.get(ConfiguracionCurso, (self.curso, self.semestre))
            seccion_id = self.fixture.carpeta.secciones[0].id
            stale.get(CarpetaSeccion, seccion_id)
            self.assertEqual(self.save().status_code, 200)
            self.assertEqual(cached.version, 1)
            with self.assertRaises(ciclo.ErrorCiclo) as failure:
                ciclo.cargar(stale, seccion_id, self.fixture.docente, "qa.pdf", b"qa", self.fixture.root)
            self.assertEqual(failure.exception.status_code, 409)
        self.assertEqual(self.db.query(Documento).count(), 0)
        self.assertFalse(self.client.get(self.url).json()["bloqueada"])

    def test_permissions_references_and_assignment_roles(self):
        for usuario in (self.fixture.docente, self.fixture.director):
            self.usuario = usuario
            self.assertEqual(self.client.get(self.url).status_code, 403)
            self.assertEqual(self.save().status_code, 403)
            self.assertEqual(self.client.get("/api/admin/catalogo").status_code, 403)
        self.usuario = self.admin
        self.assertEqual(self.client.get(self.url.replace(f"cursos/{self.curso}", "cursos/9999")).status_code, 404)
        self.assertEqual(self.client.post("/api/admin/asignaciones", json={"docente_id": self.admin.id, "curso_id": self.curso, "semestre_id": self.semestre}).status_code, 400)
        self.assertEqual(self.client.post("/api/admin/asignaciones", json={"docente_id": 99999, "curso_id": self.curso, "semestre_id": self.semestre}).status_code, 404)
        self.assertEqual(self.client.post("/api/admin/usuarios", json={"nombre": "QA", "email": "qa@example.test", "rol": "superuser"}).status_code, 422)

    def test_tracking_separates_overdue_milestones_and_late_submissions(self):
        for item in self.db.query(HitoEntrega).all():
            item.fecha_limite = datetime.now(timezone.utc) + timedelta(days=30)
        hito = self.db.get(HitoEntrega, self.fixture.hitos[0]["id"])
        hito.fecha_limite = datetime.now(timezone.utc) - timedelta(days=1)
        self.db.commit()
        self.usuario = self.fixture.director
        before = self.client.get("/api/revision/carpetas").json()["carpetas"][0]["seguimiento"]
        self.assertEqual(before["hitos_vencidos_sin_presentacion"], 1)
        self.assertEqual(before["entregas_tardias"], 0)
        self.fixture.completar(self.fixture.hitos[0])
        self.fixture.enviar()
        after = self.client.get("/api/revision/carpetas?pendientes=true").json()["carpetas"][0]["seguimiento"]
        self.assertEqual(after["hitos_vencidos_sin_presentacion"], 0)
        self.assertEqual(after["entregas_tardias"], 1)
        self.assertTrue(after["pendiente_revision"])
        self.assertEqual(self.client.get("/api/revision/carpetas?curso_id=9999").json()["carpetas"], [])
        self.usuario = self.fixture.docente
        self.assertEqual(self.client.get("/api/carpetas/mis-carpetas?q=NO-EXISTE").json(), [])
