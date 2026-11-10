from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.deps import DbSession, require_roles
from app.models.insumo import Insumo
from app.models.usuario import Usuario
from app.schemas.insumos import InsumoCreate, InsumoResponse, InsumoUpdate

router = APIRouter(prefix="/api/insumos", tags=["insumos"])


@router.get("")
def list_insumos(
    db: DbSession,
    _: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
) -> list[InsumoResponse]:
    return db.scalars(select(Insumo).where(Insumo.activo.is_(True))).all()


@router.post("", response_model=InsumoResponse, status_code=status.HTTP_201_CREATED)
def create_insumo(
    payload: InsumoCreate,
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
) -> Insumo:
    insumo = Insumo(**payload.model_dump())
    db.add(insumo)
    db.commit()
    db.refresh(insumo)
    return insumo


@router.patch("/{insumo_id}", response_model=InsumoResponse)
def update_insumo(
    insumo_id: int,
    payload: InsumoUpdate,
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
) -> Insumo:
    insumo = db.get(Insumo, insumo_id)
    if insumo is None or not insumo.activo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(insumo, field, value)
    db.commit()
    db.refresh(insumo)
    return insumo
