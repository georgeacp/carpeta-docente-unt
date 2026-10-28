import os
import unittest

# Nunca importar el arranque con las credenciales del entorno de desarrollo.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app import ciclo
from app.core.config import settings
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Documento
from app.routers import carpetas, revision
import test_ciclo as fixtures


class CicloHttpTest(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.CicloTest()
        self.fixture.setUp()
        self.usuario = self.fixture.docente
        self.previous_storage = settings.UPLOAD_DIR
        settings.UPLOAD_DIR = str(self.fixture.root)
        app = FastAPI()
        app.include_router(carpetas.router)
        app.include_router(revision.router)

        @app.exception_handler(ciclo.ErrorCiclo)
        async def error_ciclo(request, error):
            return JSONResponse(status_code=error.status_code, content={"detail": str(error)})

        app.dependency_overrides[get_current_user] = lambda: self.usuario
        app.dependency_overrides[get_db] = lambda: self.fixture.db
        self.app = app
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        settings.UPLOAD_DIR = self.previous_storage
        self.fixture.tearDown()

    def enviar(self, hito=0):
        return self.client.post(f"/api/carpetas/{self.fixture.carpeta.id}/entregas", json={"hito_id": self.fixture.hitos[hito]["id"]})

    def test_full_http_observe_correct_resubmit_approve(self):
        self.fixture.completar(self.fixture.hitos[0])
        response = self.enviar()
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["bloqueada"])
        entrega = response.json()["ciclo"]["entregas"][0]
        self.usuario = self.fixture.director
        for detalle in entrega["detalles"]:
            evaluation = self.client.put(f'/api/revision/entregas/{entrega["id"]}/documentos/{detalle["id"]}', json={"dictamen": "observado", "comentario": "Precisar evidencia"})
            self.assertEqual(evaluation.status_code, 200, evaluation.text)
        concluded = self.client.post(f'/api/revision/entregas/{entrega["id"]}/dictamen')
        self.assertEqual(concluded.json()["estado_ciclo"], "observada")
        self.usuario = self.fixture.docente
        uploaded = self.client.post(f"/api/carpetas/secciones/{self.fixture.carpeta.secciones[0].id}/documentos", files={"archivo": ("correccion.pdf", b"%PDF-1.4\ncorreccion\n%%EOF", "application/pdf")})
        self.assertEqual(uploaded.status_code, 200, uploaded.text)
        self.assertEqual(uploaded.json()["ciclo"]["entregas"][0]["detalles"][0]["dictamen"], "observado")
        reenviada = self.enviar()
        self.assertEqual(reenviada.json()["estado_ciclo"], "reenviada")
        siguiente = reenviada.json()["ciclo"]["entregas"][0]
        self.assertIsNone(siguiente["director_nombre"])
        self.usuario = self.fixture.director
        for detalle in siguiente["detalles"]:
            self.client.put(f'/api/revision/entregas/{siguiente["id"]}/documentos/{detalle["id"]}', json={"dictamen": "aprobado"})
        aprobada = self.client.post(f'/api/revision/entregas/{siguiente["id"]}/dictamen')
        self.assertEqual(aprobada.json()["estado_ciclo"], "en_progreso")
        self.assertFalse(aprobada.json()["bloqueada"])
        result = aprobada.json()["ciclo"]["entregas"][0]
        self.assertEqual(result["director_id"], self.fixture.director.id)
        self.assertEqual(result["director_nombre"], self.fixture.director.nombre)

    def test_download_requires_identity_and_does_not_fabricate_missing_file(self):
        self.fixture.cargar(self.fixture.carpeta.secciones[0])
        documento = self.fixture.db.query(Documento).one()
        url = f"/api/carpetas/documentos/{documento.id}/descargar"
        self.app.dependency_overrides.pop(get_current_user)
        self.assertEqual(self.client.get(url).status_code, 401)
        self.app.dependency_overrides[get_current_user] = lambda: self.usuario
        self.usuario = self.fixture.otro
        self.assertEqual(self.client.get(url).status_code, 403)
        self.usuario = self.fixture.docente
        self.assertEqual(self.client.get(url).status_code, 200)
        archivo = self.fixture.root / documento.ruta
        archivo.unlink()
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertFalse(archivo.exists())

    def test_old_review_route_cannot_bypass_formal_submission(self):
        self.usuario = self.fixture.director
        response = self.client.patch(f"/api/revision/secciones/{self.fixture.carpeta.secciones[0].id}/estado", json={"estado": "aprobado"})
        self.assertEqual(response.status_code, 410)

    def test_legacy_approved_items_do_not_approve_a_formal_folder(self):
        for seccion in self.fixture.carpeta.secciones:
            seccion.estado = "aprobado"
        self.fixture.db.commit()
        response = self.client.get(f"/api/carpetas/{self.fixture.carpeta.id}")
        self.assertEqual(response.json()["estado_ciclo"], "borrador")
        self.assertEqual(response.json()["ciclo"]["entregas"], [])

    def test_review_list_is_scoped_to_director_school(self):
        self.usuario = self.fixture.director
        self.assertEqual(len(self.client.get("/api/revision/carpetas").json()["carpetas"]), 1)
        self.usuario.escuela = "Otra escuela"
        self.fixture.db.commit()
        self.assertEqual(self.client.get("/api/revision/carpetas").json()["carpetas"], [])
