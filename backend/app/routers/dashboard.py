from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import joinedload

from app.core.deps import DbSession, require_roles
from app.models.insumo import Insumo
from app.models.movimiento import Movimiento, TipoMovimientoEnum
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _classify_priority_status(stock_actual: float, stock_minimo: float) -> str:
    if stock_minimo > 0 and stock_actual < 0.60 * stock_minimo:
        return "Crítico"
    if stock_actual < stock_minimo:
        return "Alerta"
    if stock_minimo > 0 and stock_actual < 1.15 * stock_minimo:
        return "Revisión"
    return "Estable"


@router.get("")
def get_dashboard_summary(
    db: DbSession,
    _: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
) -> dict[str, object]:
    insumos = db.scalars(
        select(Insumo).where(Insumo.activo.is_(True)).order_by(Insumo.id)
    ).all()

    total_insumos = len(insumos)
    stock_critico_count = sum(
        1
        for item in insumos
        if float(item.stock_minimo) > 0
        and float(item.stock_actual) < 0.60 * float(item.stock_minimo)
    )
    alertas_activas_count = sum(
        1
        for item in insumos
        if float(item.stock_actual) < float(item.stock_minimo)
    )

    movimientos_recientes_db = db.scalars(
        select(Movimiento)
        .options(joinedload(Movimiento.insumo), joinedload(Movimiento.usuario))
        .order_by(desc(Movimiento.fecha_operacion), desc(Movimiento.id))
        .limit(8)
    ).all()

    salidas = db.scalars(
        select(Movimiento).where(Movimiento.tipo == TipoMovimientoEnum.SALIDA)
    ).all()
    total_salidas = sum(float(m.cantidad) for m in salidas)
    prediccion_semanal_total = round(total_salidas / 8.5, 1) if total_salidas > 0 else 245.0

    insumos_prioritarios = [
        {
            "id": item.id,
            "codigo": f"INS-{item.id:03d}",
            "nombre": item.nombre,
            "categoria": item.categoria,
            "unidad": item.unidad,
            "stock_actual": float(item.stock_actual),
            "stock_minimo": float(item.stock_minimo),
            "estado": _classify_priority_status(
                float(item.stock_actual), float(item.stock_minimo)
            ),
        }
        for item in sorted(
            insumos,
            key=lambda x: (
                float(x.stock_actual) / float(x.stock_minimo)
                if float(x.stock_minimo) > 0
                else 999.0
            ),
        )
    ]

    movimientos_recientes = [
        {
            "id": mov.id,
            "insumo_id": mov.insumo_id,
            "insumo_nombre": mov.insumo.nombre
            if mov.insumo
            else f"Insumo #{mov.insumo_id}",
            "unidad": mov.insumo.unidad if mov.insumo else "",
            "tipo": mov.tipo.value if hasattr(mov.tipo, "value") else str(mov.tipo),
            "cantidad": float(mov.cantidad),
            "documento_referencia": mov.documento_referencia,
            "fecha_operacion": mov.fecha_operacion.isoformat(),
            "usuario_nombre": mov.usuario.nombre if mov.usuario else "Operador",
        }
        for mov in movimientos_recientes_db
    ]

    distribucion_categorias = [
        {"categoria": "Papel", "porcentaje": 38, "color": "#0F52BA"},
        {"categoria": "Tintas", "porcentaje": 24, "color": "#00A4E4"},
        {"categoria": "Planchas", "porcentaje": 18, "color": "#10B981"},
        {"categoria": "Otros", "porcentaje": 20, "color": "#F59E0B"},
    ]

    return {
        "total_insumos": total_insumos,
        "stock_critico_count": stock_critico_count,
        "alertas_activas_count": alertas_activas_count,
        "prediccion_semanal_total": prediccion_semanal_total,
        "insumos_prioritarios": insumos_prioritarios,
        "movimientos_recientes": movimientos_recientes,
        "distribucion_categorias": distribucion_categorias,
    }
