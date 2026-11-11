import math
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
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
    _: Annotated[Usuario, Depends(require_roles(["administrador", "trabajador"]))],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=200)] = 10,
    insumo_id: Annotated[Optional[int], Query()] = None,
    tipo: Annotated[Optional[str], Query()] = None,
) -> dict[str, object]:
    filters = []
    if insumo_id is not None:
        filters.append(Movimiento.insumo_id == insumo_id)

    if tipo is not None and tipo.strip():
        normalized_tipo = tipo.strip().upper()
        if normalized_tipo == TipoMovimientoEnum.ENTRADA.value:
            filters.append(Movimiento.tipo == TipoMovimientoEnum.ENTRADA)
        elif normalized_tipo == TipoMovimientoEnum.SALIDA.value:
            filters.append(Movimiento.tipo == TipoMovimientoEnum.SALIDA)

    count_stmt = select(func.count(Movimiento.id))
    if filters:
        count_stmt = count_stmt.where(*filters)
    total_records = int(db.scalar(count_stmt) or 0)

    offset = (page - 1) * limit
    statement = (
        select(Movimiento)
        .options(joinedload(Movimiento.insumo), joinedload(Movimiento.usuario))
        .order_by(desc(Movimiento.fecha_operacion), desc(Movimiento.id))
        .offset(offset)
        .limit(limit)
    )
    if filters:
        statement = statement.where(*filters)

    movimientos = db.scalars(statement).all()
    items = [
        {
            "id": mov.id,
            "insumo_id": mov.insumo_id,
            "insumo_nombre": (
                mov.insumo.nombre if mov.insumo else f"Insumo #{mov.insumo_id}"
            ),
            "unidad": mov.insumo.unidad if mov.insumo else "",
            "tipo": (mov.tipo.value if hasattr(mov.tipo, "value") else str(mov.tipo)),
            "cantidad": float(mov.cantidad),
            "motivo": mov.motivo,
            "proveedor": mov.proveedor,
            "documento_referencia": mov.documento_referencia,
            "observaciones": mov.observaciones,
            "fecha_operacion": mov.fecha_operacion.isoformat(),
            "usuario_id": mov.usuario_id,
            "usuario_nombre": (mov.usuario.nombre if mov.usuario else "Operador"),
        }
        for mov in movimientos
    ]

    total_pages = math.ceil(total_records / limit) if limit > 0 else 0

    return {
        "items": items,
        "total": total_records,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


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

    delta = (
        payload.cantidad
        if payload.tipo is TipoMovimientoEnum.ENTRADA
        else -payload.cantidad
    )
    insumo.stock_actual += delta
    movimiento = Movimiento(**payload.model_dump(), usuario_id=current_user.id)
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return {
        "id": movimiento.id,
        "insumo_id": movimiento.insumo_id,
        "tipo": (
            movimiento.tipo.value
            if hasattr(movimiento.tipo, "value")
            else str(movimiento.tipo)
        ),
        "cantidad": float(movimiento.cantidad),
        "saldo_resultante": float(insumo.stock_actual),
        "fecha_operacion": movimiento.fecha_operacion.isoformat(),
        "usuario_id": movimiento.usuario_id,
    }
