from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.deps import require_roles
from app.core.deps import DbSession
from app.models.insumo import Insumo
from app.models.movimiento import Movimiento, TipoMovimientoEnum
from app.models.usuario import Usuario
from app.schemas.movimientos import MovimientoCreate

router = APIRouter(prefix="/api/movimientos", tags=["movimientos"])


@router.post("")
def create_movimiento(
    payload: MovimientoCreate,
    db: DbSession,
    current_user: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
) -> dict[str, object]:
    insumo = db.scalar(
        select(Insumo).where(Insumo.id == payload.insumo_id).with_for_update()
    )
    if insumo is None or not insumo.activo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado.")
    if (
        payload.tipo is TipoMovimientoEnum.SALIDA
        and payload.cantidad > insumo.stock_actual
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Stock insuficiente. Stock actual: {insumo.stock_actual}, "
                f"solicitado: {payload.cantidad}."
            ),
        )

    delta = payload.cantidad if payload.tipo is TipoMovimientoEnum.ENTRADA else -payload.cantidad
    insumo.stock_actual += delta
    movimiento = Movimiento(**payload.model_dump(), usuario_id=current_user.id)
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return {"id": movimiento.id, "insumo_id": movimiento.insumo_id, "tipo": movimiento.tipo}
