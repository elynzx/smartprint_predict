from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.deps import DbSession, require_roles
from app.models.insumo import Insumo
from app.models.usuario import Usuario
from app.schemas.insumos import InsumoCreate, InsumoResponse, InsumoUpdate

router = APIRouter(prefix="/api/insumos", tags=["insumos"])

_SUPPLIER_OVERRIDES: dict[int, str] = {}
_INSUMO_MODEL_COLUMNS = {
    "nombre",
    "unidad",
    "stock_actual",
    "stock_minimo",
    "costo_unitario",
    "categoria",
}


def _attach_supplier(insumo: Insumo) -> Insumo:
    supplier = _SUPPLIER_OVERRIDES.get(insumo.id)
    setattr(insumo, "proveedor", supplier)
    setattr(insumo, "proveedor_referencial", supplier)
    return insumo


@router.get("")
def list_insumos(
    db: DbSession,
    _: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
) -> list[InsumoResponse]:
    items = db.scalars(select(Insumo).where(Insumo.activo.is_(True))).all()
    return [_attach_supplier(item) for item in items]


@router.post("", response_model=InsumoResponse, status_code=status.HTTP_201_CREATED)
def create_insumo(
    payload: InsumoCreate,
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
) -> Insumo:
    raw_data = payload.model_dump()
    supplier = raw_data.get("proveedor") or raw_data.get("proveedor_referencial")
    orm_data = {
        key: value
        for key, value in raw_data.items()
        if key in _INSUMO_MODEL_COLUMNS
    }
    insumo = Insumo(**orm_data)
    db.add(insumo)
    db.commit()
    db.refresh(insumo)
    if supplier:
        _SUPPLIER_OVERRIDES[insumo.id] = str(supplier).strip()
    return _attach_supplier(insumo)


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
    updates = payload.model_dump(exclude_unset=True)
    supplier = updates.get("proveedor") or updates.get("proveedor_referencial")
    for field, value in updates.items():
        if field in _INSUMO_MODEL_COLUMNS:
            setattr(insumo, field, value)
    db.commit()
    db.refresh(insumo)
    if supplier is not None and str(supplier).strip():
        _SUPPLIER_OVERRIDES[insumo.id] = str(supplier).strip()
    return _attach_supplier(insumo)
