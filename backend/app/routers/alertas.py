from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.deps import DbSession, require_roles
from app.models.insumo import Insumo
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/alertas", tags=["alertas"])


@router.get("")
def list_active_alerts(
    db: DbSession,
    _: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
) -> list[dict[str, object]]:
    insumos = db.scalars(
        select(Insumo)
        .where(Insumo.activo.is_(True), Insumo.stock_actual < Insumo.stock_minimo)
        .order_by(Insumo.stock_actual)
    ).all()
    return [
        {
            "id": insumo.id,
            "insumo_id": insumo.id,
            "nombre": insumo.nombre,
            "prioridad": "Alta" if insumo.stock_actual < insumo.stock_minimo * 0.6 else "Media",
        }
        for insumo in insumos
    ]
