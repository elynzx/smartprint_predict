from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select

from app.core.deps import DbSession, require_roles
from app.models.insumo import Insumo
from app.models.usuario import Usuario
from app.schemas.disponibilidad import DisponibilidadResponse

router = APIRouter(prefix="/api/disponibilidad", tags=["disponibilidad"])


@router.get("", response_model=list[DisponibilidadResponse])
def get_disponibilidad(
    db: DbSession,
    query: Annotated[str | None, Query(alias="q")] = None,
    _: Annotated[
        Usuario, Depends(require_roles(["asesor_comercial", "administrador"]))
    ] = None,
) -> list[DisponibilidadResponse]:
    statement = select(Insumo).where(Insumo.activo.is_(True))
    if query:
        search = f"%{query}%"
        statement = statement.where(
            or_(Insumo.nombre.ilike(search), Insumo.categoria.ilike(search))
        )

    insumos = db.scalars(statement.order_by(Insumo.nombre)).all()
    return [
        DisponibilidadResponse(
            insumo_id=insumo.id,
            nombre=insumo.nombre,
            unidad=insumo.unidad,
            estado_disponibilidad=(
                "Disponible"
                if insumo.stock_actual > insumo.stock_minimo
                else "Stock Limitado"
            ),
            observacion_comercial=(
                "Insumo apto para programación de proyecto"
                if insumo.stock_actual > insumo.stock_minimo
                else "Requiere confirmación de plazo con almacén"
            ),
        )
        for insumo in insumos
    ]
