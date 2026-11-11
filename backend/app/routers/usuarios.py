from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select

from app.core.deps import DbSession, require_roles
from app.core.security import get_password_hash
from app.models.usuario import RolEnum, Usuario

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: RolEnum
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class UsuarioCreateRequest(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=4, max_length=128)
    rol: RolEnum
    activo: bool = True


class UsuarioUpdateRequest(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[str] = Field(default=None, min_length=3, max_length=255)
    rol: Optional[RolEnum] = None
    activo: Optional[bool] = None
    password: Optional[str] = Field(default=None, max_length=128)


@router.get("", response_model=list[UsuarioResponse])
def list_usuarios(
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.id)).all())


@router.post(
    "",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_usuario(
    payload: UsuarioCreateRequest,
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
) -> Usuario:
    clean_email = payload.email.strip().lower()
    existing = db.scalar(
        select(Usuario).where(func.lower(Usuario.email) == clean_email)
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado.",
        )

    usuario = Usuario(
        nombre=payload.nombre.strip(),
        email=clean_email,
        password_hash=get_password_hash(payload.password),
        rol=payload.rol,
        activo=payload.activo,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{user_id}", response_model=UsuarioResponse)
def update_usuario(
    user_id: int,
    payload: UsuarioUpdateRequest,
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
) -> Usuario:
    usuario = db.get(Usuario, user_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] is not None:
        clean_email = str(updates["email"]).strip().lower()
        duplicate = db.scalar(
            select(Usuario).where(
                func.lower(Usuario.email) == clean_email,
                Usuario.id != user_id,
            )
        )
        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya pertenece a otro usuario.",
            )
        usuario.email = clean_email

    if "nombre" in updates and updates["nombre"] is not None:
        usuario.nombre = str(updates["nombre"]).strip()

    if "rol" in updates and updates["rol"] is not None:
        usuario.rol = updates["rol"]

    if "activo" in updates and updates["activo"] is not None:
        usuario.activo = bool(updates["activo"])

    if "password" in updates and updates["password"]:
        raw_pwd = str(updates["password"]).strip()
        if raw_pwd:
            usuario.password_hash = get_password_hash(raw_pwd)

    db.commit()
    db.refresh(usuario)
    return usuario
