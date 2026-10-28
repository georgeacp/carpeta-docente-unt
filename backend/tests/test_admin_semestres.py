import os
import unittest
from datetime import datetime, timezone

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Semestre
from app.routers import admin
import test_ciclo as fixtures


class SemestreHttpTest(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.CicloTest()
        self.fixture.setUp()
        self.fixture.director.rol = "admin"
        self.fixture.db.commit()
        app = FastAPI()
        app.include_router(admin.router)
        app.dependency_overrides[get_db] = lambda: self.fixture.db
        app.dependency_overrides[get_current_user] = lambda: self.fixture.director
        self.client = TestClient(app)
        self.payload = {"nombre": "QA-2027", "inicio": "2027-04-01", "fin": "2027-07-30", "fecha_limite": "2027-07-30T23:59:00-05:00", "activo": True}

    def tearDown(self):
        self.client.close()
        self.fixture.tearDown()

    def test_invalid_dates_do_not_create_or_deactivate(self):
        for changes in [
            {"inicio": "2027-08-01"},
            {"fecha_limite": "2027-07-29T23:59:00-05:00"},
            {"fecha_limite": "2027-07-30T23:59:00"},
            # UTC date is the end date, but Peru is still the previous day.
            {"fecha_limite": "2027-07-30T02:00:00Z"},
        ]:
            with self.subTest(changes=changes):
                response = self.client.post("/api/admin/semestres", json={**self.payload, **changes})
                self.assertEqual(response.status_code, 422, response.text)
                semesters = self.fixture.db.scalars(select(Semestre)).all()
                self.assertEqual(len(semesters), 1)
                self.assertTrue(semesters[0].activo)

    def test_valid_deadline_is_utc_and_activation_is_consistent(self):
        response = self.client.post("/api/admin/semestres", json=self.payload)
        self.assertEqual(response.status_code, 200, response.text)
        semesters = self.fixture.db.scalars(select(Semestre).order_by(Semestre.id)).all()
        self.assertFalse(semesters[0].activo)
        self.assertTrue(semesters[1].activo)
        self.assertEqual(semesters[1].fecha_limite.replace(tzinfo=timezone.utc), datetime(2027, 7, 31, 4, 59, tzinfo=timezone.utc))
        catalog = self.client.get("/api/admin/catalogo").json()
        self.assertEqual(catalog["semestres"][0]["fecha_limite"], "2027-07-31T04:59:00+00:00")
        duplicate = self.client.post("/api/admin/semestres", json=self.payload)
        self.assertEqual(duplicate.status_code, 400)
        self.assertTrue(semesters[1].activo)
