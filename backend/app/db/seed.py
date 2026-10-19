from datetime import date, datetime, timezone
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.models import (
    Asignacion,
    Carpeta,
    CarpetaSeccion,
    Curso,
    Documento,
    HistorialAccion,
    Observacion,
    PlantillaSeccion,
    Semestre,
    Usuario,
)


SECCIONES_UNT = [
    {
        "orden": 1,
        "nombre": "1. Datos del docente y carga horaria",
        "descripcion": "Ficha curricular resumida, horario oficial y resolución de carga lectiva y no lectiva visada por el Departamento Académico.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,docx",
    },
    {
        "orden": 2,
        "nombre": "2. Sílabo por competencias visado",
        "descripcion": "Sílabo oficial en formato UNT alineado al currículo vigente, firmado por el docente y visado por la Dirección de Escuela.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,docx",
    },
    {
        "orden": 3,
        "nombre": "3. Plan de sesiones y avance de contenidos",
        "descripcion": "Cronograma detallado de las 16 semanas lectivas y registro de cumplimiento porcentual por unidad.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,docx,xlsx",
    },
    {
        "orden": 4,
        "nombre": "4. Registro de asistencia de estudiantes",
        "descripcion": "Reporte consolidado de asistencia por unidad académica exportado del SUV o plantilla oficial.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,xlsx",
    },
    {
        "orden": 5,
        "nombre": "5. Registro de notas y registro auxiliar",
        "descripcion": "Actas promocionales y registro auxiliar detallado de evaluaciones continuas y de unidad.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,xlsx",
    },
    {
        "orden": 6,
        "nombre": "6. Instrumentos de evaluación (exámenes, rúbricas, listas de cotejo)",
        "descripcion": "Exámenes parciales/finales aplicados, rúbricas de proyectos y matrices de evaluación por resultados del estudiante.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,docx,xlsx",
    },
    {
        "orden": 7,
        "nombre": "7. Material didáctico empleado",
        "descripcion": "Guías de laboratorio, diapositivas de cátedra, lecturas seleccionadas y recursos publicados en el Aula Virtual UNT.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,docx,png,jpg",
    },
    {
        "orden": 8,
        "nombre": "8. Evidencias de estudiantes (muestras de trabajos)",
        "descripcion": "Muestras representativas (nota alta, promedio y baja) de informes, proyectos integradores o exámenes calificados.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,docx,png,jpg",
    },
    {
        "orden": 9,
        "nombre": "9. Informe final del curso y mejora continua",
        "descripcion": "Análisis estadístico de aprobados/desaprobados, logro de competencias, dificultades encontradas y plan de mejora.",
        "obligatoria": True,
        "tipos_permitidos": "pdf,docx",
    },
    {
        "orden": 10,
        "nombre": "10. Tutoría, investigación formativa y RSU (si aplica)",
        "descripcion": "Evidencias de consejería académica, vinculación con proyectos de Responsabilidad Social Universitaria o I+D.",
        "obligatoria": False,
        "tipos_permitidos": "pdf,docx,png,jpg",
    },
]


def _write_dummy_pdf(filepath: Path, title: str):
    filepath.parent.mkdir(parents=True, exist_ok=True)
    content = (
        f"%PDF-1.4\n"
        f"% Documento oficial Carpeta Docente UNT: {title}\n"
        f"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        f"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        f"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj\n"
        f"xref\n0 4\n0000000000 65535 f \n"
        f"trailer << /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF"
    )
    filepath.write_bytes(content.encode("utf-8"))


def crear_carpeta_para_asignacion(db: Session, asignacion: Asignacion, actor_id: int) -> Carpeta:
    plantillas = db.query(PlantillaSeccion).order_by(PlantillaSeccion.orden.asc()).all()
    carpeta = Carpeta(asignacion_id=asignacion.id)
    db.add(carpeta)
    db.flush()

    for p in plantillas:
        cs = CarpetaSeccion(
            carpeta_id=carpeta.id,
            plantilla_id=p.id,
            estado="pendiente",
        )
        db.add(cs)

    db.add(
        HistorialAccion(
            carpeta_id=carpeta.id,
            usuario_id=actor_id,
            accion="CARPETA_GENERADA",
            detalle=f"Carpeta generada automáticamente con {len(plantillas)} secciones para la sección {asignacion.seccion}.",
        )
    )
    db.flush()
    return carpeta


def seed_initial_data(db: Session):
    # Check if already seeded
    if db.query(Usuario).first() is not None:
        return

    pw_hash = get_password_hash("unt2026")

    # 1. Usuarios (Docentes, Revisor, Admin)
    admin_user = Usuario(
        nombre="Ing. Roberto Mendoza — Admin Académico",
        email="admin@unitru.edu.pe",
        password_hash=pw_hash,
        rol="admin",
        escuela="Facultad de Ingeniería",
        categoria="Administrador del Sistema",
    )
    revisor_user = Usuario(
        nombre="Dr. Ricardo Guevara — Director de Escuela",
        email="revisor@unitru.edu.pe",
        password_hash=pw_hash,
        rol="revisor",
        escuela="Ingeniería de Sistemas",
        categoria="Director de Escuela / Comité de Calidad",
    )
    docente_1 = Usuario(
        nombre="Dr. Carlos Alcántara Vega",
        email="docente@unitru.edu.pe",
        password_hash=pw_hash,
        rol="docente",
        escuela="Ingeniería de Sistemas",
        categoria="Docente Ordinario - Principal TC",
    )
    docente_2 = Usuario(
        nombre="Dra. Elena Vargas Morales",
        email="evargas@unitru.edu.pe",
        password_hash=pw_hash,
        rol="docente",
        escuela="Ingeniería de Sistemas",
        categoria="Docente Ordinario - Asociado DE",
    )
    docente_3 = Usuario(
        nombre="Mg. Jorge Rodríguez Paredes",
        email="jrodriguez@unitru.edu.pe",
        password_hash=pw_hash,
        rol="docente",
        escuela="Ingeniería de Sistemas",
        categoria="Docente Contratado - Tipo A1",
    )

    db.add_all([admin_user, revisor_user, docente_1, docente_2, docente_3])
    db.flush()

    # 2. Plantilla de las 10 secciones UNT
    plantillas_objs = []
    for item in SECCIONES_UNT:
        ps = PlantillaSeccion(**item)
        db.add(ps)
        plantillas_objs.append(ps)
    db.flush()

    # 3. Semestres Académicos
    sem_actual = Semestre(
        nombre="2026-II",
        inicio=date(2026, 8, 24),
        fin=date(2026, 12, 18),
        fecha_limite=datetime(2026, 12, 22, 23, 59, tzinfo=timezone.utc),
        activo=True,
    )
    sem_anterior = Semestre(
        nombre="2026-I",
        inicio=date(2026, 4, 1),
        fin=date(2026, 7, 31),
        fecha_limite=datetime(2026, 8, 5, 23, 59, tzinfo=timezone.utc),
        activo=False,
    )
    db.add_all([sem_actual, sem_anterior])
    db.flush()

    # 4. Catálogo de Cursos UNT
    curso_sw2 = Curso(
        codigo="ING-304",
        nombre="Ingeniería de Software II",
        escuela="Ingeniería de Sistemas",
        ciclo=6,
    )
    curso_ia = Curso(
        codigo="ING-401",
        nombre="Inteligencia Artificial",
        escuela="Ingeniería de Sistemas",
        ciclo=8,
    )
    curso_arq = Curso(
        codigo="ING-205",
        nombre="Arquitectura de Computadoras",
        escuela="Ingeniería de Sistemas",
        ciclo=5,
    )
    curso_gp = Curso(
        codigo="ING-502",
        nombre="Gestión de Proyectos de TI",
        escuela="Ingeniería de Sistemas",
        ciclo=9,
    )
    db.add_all([curso_sw2, curso_ia, curso_arq, curso_gp])
    db.flush()

    # 5. Asignaciones y Carpetas Automáticas (RF3, RF4)
    asig_1 = Asignacion(docente_id=docente_1.id, curso_id=curso_sw2.id, semestre_id=sem_actual.id, seccion="A")
    asig_2 = Asignacion(docente_id=docente_1.id, curso_id=curso_ia.id, semestre_id=sem_actual.id, seccion="B")
    asig_3 = Asignacion(docente_id=docente_2.id, curso_id=curso_arq.id, semestre_id=sem_actual.id, seccion="A")
    asig_4 = Asignacion(docente_id=docente_3.id, curso_id=curso_gp.id, semestre_id=sem_actual.id, seccion="Única")
    db.add_all([asig_1, asig_2, asig_3, asig_4])
    db.flush()

    carpeta_1 = crear_carpeta_para_asignacion(db, asig_1, admin_user.id)
    carpeta_2 = crear_carpeta_para_asignacion(db, asig_2, admin_user.id)
    carpeta_3 = crear_carpeta_para_asignacion(db, asig_3, admin_user.id)
    carpeta_4 = crear_carpeta_para_asignacion(db, asig_4, admin_user.id)

    # 6. Poblar documentos, estados y observaciones reales en Carpeta 1 (Ingeniería de Software II - Dr. Carlos Alcántara)
    secciones_c1 = (
        db.query(CarpetaSeccion)
        .join(PlantillaSeccion)
        .filter(CarpetaSeccion.carpeta_id == carpeta_1.id)
        .order_by(PlantillaSeccion.orden.asc())
        .all()
    )

    storage = settings.storage_path

    # Sección 1: Aprobada
    sec1 = secciones_c1[0]
    sec1.estado = "aprobado"
    rel_p1 = "2026-II/ING-304_A/sec_1/v1_Carga_Horaria_Alcantara_2026_II.pdf"
    _write_dummy_pdf(storage / rel_p1, "Carga Horaria Dr. Carlos Alcantara")
    db.add(Documento(carpeta_seccion_id=sec1.id, nombre="Carga_Horaria_Alcantara_2026_II.pdf", ruta=rel_p1, tamano_mb=0.85, version=1, subido_por=docente_1.id))

    # Sección 2: Aprobada con 2 versiones
    sec2 = secciones_c1[1]
    sec2.estado = "aprobado"
    rel_p2_v1 = "2026-II/ING-304_A/sec_2/v1_Silabo_IngSoftwareII_Borrador.pdf"
    rel_p2_v2 = "2026-II/ING-304_A/sec_2/v2_Silabo_IngSoftwareII_Visado_UNT.pdf"
    _write_dummy_pdf(storage / rel_p2_v1, "Silabo v1 Borrador")
    _write_dummy_pdf(storage / rel_p2_v2, "Silabo v2 Visado Oficial UNT")
    db.add(Documento(carpeta_seccion_id=sec2.id, nombre="Silabo_IngSoftwareII_Borrador.pdf", ruta=rel_p2_v1, tamano_mb=1.12, version=1, subido_por=docente_1.id))
    db.add(Documento(carpeta_seccion_id=sec2.id, nombre="Silabo_IngSoftwareII_Visado_UNT.pdf", ruta=rel_p2_v2, tamano_mb=1.45, version=2, subido_por=docente_1.id))

    # Sección 3: Observada por el Director de Escuela
    sec3 = secciones_c1[2]
    sec3.estado = "observado"
    rel_p3 = "2026-II/ING-304_A/sec_3/v1_Plan_Sesiones_SW2.pdf"
    _write_dummy_pdf(storage / rel_p3, "Plan de Sesiones SW2")
    db.add(Documento(carpeta_seccion_id=sec3.id, nombre="Plan_Sesiones_SW2.pdf", ruta=rel_p3, tamano_mb=0.94, version=1, subido_por=docente_1.id))
    db.add(
        Observacion(
            carpeta_seccion_id=sec3.id,
            revisor_id=revisor_user.id,
            texto="Falta detallar las semanas 13 a 15 correspondientes a la Unidad III (Pruebas automatizadas y despliegue continuo) y consignar la firma digital del docente.",
            resuelta=False,
        )
    )

    # Sección 4: Entregada (Pendiente de visto bueno del revisor)
    sec4 = secciones_c1[3]
    sec4.estado = "entregado"
    rel_p4 = "2026-II/ING-304_A/sec_4/v1_Asistencia_Unidad_I_SUV.xlsx"
    _write_dummy_pdf(storage / rel_p4, "Registro de Asistencia SUV")
    db.add(Documento(carpeta_seccion_id=sec4.id, nombre="Asistencia_Unidad_I_SUV.xlsx", ruta=rel_p4, tamano_mb=0.42, version=1, subido_por=docente_1.id))

    # Sección 5: Entregada
    sec5 = secciones_c1[4]
    sec5.estado = "entregado"
    rel_p5 = "2026-II/ING-304_A/sec_5/v1_Registro_Auxiliar_Notas_U1.xlsx"
    _write_dummy_pdf(storage / rel_p5, "Registro Auxiliar Notas")
    db.add(Documento(carpeta_seccion_id=sec5.id, nombre="Registro_Auxiliar_Notas_U1.xlsx", ruta=rel_p5, tamano_mb=0.56, version=1, subido_por=docente_1.id))

    # Sección 6: Aprobada
    sec6 = secciones_c1[5]
    sec6.estado = "aprobado"
    rel_p6 = "2026-II/ING-304_A/sec_6/v1_Rubricas_Proyecto_Integrador_ICACIT.pdf"
    _write_dummy_pdf(storage / rel_p6, "Rubricas ICACIT")
    db.add(Documento(carpeta_seccion_id=sec6.id, nombre="Rubricas_Proyecto_Integrador_ICACIT.pdf", ruta=rel_p6, tamano_mb=2.15, version=1, subido_por=docente_1.id))

    # Historial de auditoría para Carpeta 1
    db.add_all(
        [
            HistorialAccion(
                carpeta_id=carpeta_1.id,
                usuario_id=docente_1.id,
                accion="DOCUMENTO_SUBIDO",
                detalle="Subió 'Silabo_IngSoftwareII_Visado_UNT.pdf' (Versión 2) en '2. Sílabo por competencias visado'.",
            ),
            HistorialAccion(
                carpeta_id=carpeta_1.id,
                usuario_id=revisor_user.id,
                accion="SECCION_APROBADA",
                detalle="Aprobó la sección '2. Sílabo por competencias visado'.",
            ),
            HistorialAccion(
                carpeta_id=carpeta_1.id,
                usuario_id=revisor_user.id,
                accion="SECCION_OBSERVADA",
                detalle="Observó '3. Plan de sesiones y avance de contenidos': Falta detallar las semanas 13 a 15.",
            ),
        ]
    )

    # Poblar Carpeta 3 (Dra. Elena Vargas - 100% Completa y Aprobada para que el Revisor vea variedad)
    secciones_c3 = (
        db.query(CarpetaSeccion)
        .join(PlantillaSeccion)
        .filter(CarpetaSeccion.carpeta_id == carpeta_3.id)
        .order_by(PlantillaSeccion.orden.asc())
        .all()
    )
    for idx, s in enumerate(secciones_c3):
        if s.plantilla.obligatoria:
            s.estado = "aprobado"
            rel_path = f"2026-II/ING-205_A/sec_{idx+1}/v1_Evidencia_Oficial_Seccion_{idx+1}.pdf"
            _write_dummy_pdf(storage / rel_path, f"Evidencia Seccion {idx+1}")
            db.add(
                Documento(
                    carpeta_seccion_id=s.id,
                    nombre=f"Evidencia_Oficial_Seccion_{idx+1}.pdf",
                    ruta=rel_path,
                    tamano_mb=1.1,
                    version=1,
                    subido_por=docente_2.id,
                )
            )

    # Poblar Carpeta 2 (Inteligencia Artificial - Dr. Carlos Alcántara - En progreso inicial 22%)
    secciones_c2 = (
        db.query(CarpetaSeccion)
        .join(PlantillaSeccion)
        .filter(CarpetaSeccion.carpeta_id == carpeta_2.id)
        .order_by(PlantillaSeccion.orden.asc())
        .all()
    )
    for idx in range(2):
        s = secciones_c2[idx]
        s.estado = "entregado"
        rel_path = f"2026-II/ING-401_B/sec_{idx+1}/v1_Documento_IA_Seccion_{idx+1}.pdf"
        _write_dummy_pdf(storage / rel_path, f"IA Seccion {idx+1}")
        db.add(
            Documento(
                carpeta_seccion_id=s.id,
                nombre=f"Documento_IA_Seccion_{idx+1}.pdf",
                ruta=rel_path,
                tamano_mb=0.95,
                version=1,
                subido_por=docente_1.id,
            )
        )

    db.commit()
