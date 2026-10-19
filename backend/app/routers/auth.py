from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_current_user, verify_password
from app.db.database import get_db
from app.db.models import Usuario

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


class LoginRequest(BaseModel):
    email: str
    password: str


class DemoRoleRequest(BaseModel):
    rol: str  # docente | revisor | admin


def _serialize_user(user: Usuario) -> dict:
    return {
        "id": user.id,
        "nombre": user.nombre,
        "email": user.email,
        "rol": user.rol,
        "escuela": user.escuela,
        "categoria": user.categoria,
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(Usuario)
        .filter(Usuario.email == payload.email.strip().lower(), Usuario.activo == True)
        .first()
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales institucionales incorrectas.",
        )

    token = create_access_token({"sub_id": user.id, "email": user.email, "rol": user.rol})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": _serialize_user(user),
    }


@router.post("/demo-login")
def demo_login(payload: DemoRoleRequest, db: Session = Depends(get_db)):
    """Acceso rápido de 1 clic para pruebas del MVP por rol (docente, revisor, admin) o Google Institucional."""
    email_map = {
        "docente": "docente@unitru.edu.pe",
        "revisor": "revisor@unitru.edu.pe",
        "admin": "admin@unitru.edu.pe",
    }
    target_email = email_map.get(payload.rol)
    user = None
    if target_email:
        user = db.query(Usuario).filter(Usuario.email == target_email, Usuario.activo == True).first()
    if not user:
        user = db.query(Usuario).filter(Usuario.rol == payload.rol, Usuario.activo == True).first()

    if not user:
        raise HTTPException(status_code=404, detail=f"No se encontró cuenta demo para el rol {payload.rol}.")

    token = create_access_token({"sub_id": user.id, "email": user.email, "rol": user.rol})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": _serialize_user(user),
    }


@router.get("/me")
def get_me(current_user: Usuario = Depends(get_current_user)):
    return _serialize_user(current_user)
