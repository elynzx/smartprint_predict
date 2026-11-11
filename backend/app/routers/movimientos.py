from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import joinedload

from app.core.deps import DbSession, require_roles
from app.models.insumo import Insumo
from app.models.movimiento import Movimiento, TipoMovimientoEnum
from app.models.usuario import Usuario
from app.schemas.movimientos import MovimientoCreate

router = APIRouter(prefix="/api/movimientos", tags=["movimientos"])


@router.get("")
def list_movimientos(
    db: DbSession,
    _: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    insumo_id: Annotated[int | None, Query()] = None,
) -> list[dict[str, object]]:
    statement = (
        select(Movimiento)
        .options(joinedload(Movimiento.insumo), joinedload(Movimiento.usuario))
        .order_by(desc(Movimiento.fecha_operacion), desc(Movimiento.id))
        .limit(limit)
    )
    if insumo_id is not None:
        statement = statement.where(Movimiento.insumo_id == insumo_id)

    movimientos = db.scalars(statement).all()
    return [
        {
            "id": mov.id,
            "insumo_id": mov.insumo_id,
            "insumo_nombre": mov.insumo.nombre if mov.insumo else f"Insumo #{mov.insumo_id}",
            "unidad": mov.insumo.unidad if mov.insumo else "",
            "tipo": mov.tipo.value if hasattr(mov.tipo, "value") else str(mov.tipo),
            "cantidad": float(mov.cantidad),
            "motivo": mov.motivo,
            "proveedor": mov.proveedor,
            "documento_referencia": mov.documento_referencia,
            "observaciones": mov.observaciones,
            "fecha_operacion": mov.fecha_operacion.isoformat(),
            "usuario_id": mov.usuario_id,
            "usuario_nombre": mov.usuario.nombre if mov.usuario else "Operador",
        }
        for mov in movimientos
    ]


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
    return {
        "id": movimiento.id,
        "insumo_id": movimiento.insumo_id,
        "tipo": movimiento.tipo.value if hasattr(movimiento.tipo, "value") else str(movimiento.tipo),
        "cantidad": float(movimiento.cantidad),
        "saldo_resultante": float(insumo.stock_actual),
        "fecha_operacion": movimiento.fecha_operacion.isoformat(),
        "usuario_id": movimiento.usuario_id,
    }
