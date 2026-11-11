from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.core.deps import DbSession, require_roles
from app.ml.engine import calcular_prediccion_insumo
from app.models.insumo import Insumo
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/alertas", tags=["alertas"])


def _estimate_depletion_days(
    insumo: Insumo,
    predicted_days: int | None,
) -> int:
    if predicted_days is not None and predicted_days >= 0:
        return predicted_days

    stock_actual = float(insumo.stock_actual)
    stock_minimo = max(float(insumo.stock_minimo), 1.0)
    if stock_actual <= 0:
        return 0
    return max(1, int(round((stock_actual / stock_minimo) * 12)))


@router.get("")
def list_active_alerts(
    db: DbSession,
    _: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
    estado: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[dict[str, object]]:
    insumos = db.scalars(
        select(Insumo)
        .where(
            Insumo.activo.is_(True),
            Insumo.stock_actual < Insumo.stock_minimo,
        )
        .order_by(Insumo.stock_actual)
    ).all()

    normalized_filter = estado.strip().lower() if estado else None
    if normalized_filter == "crítico":
        normalized_filter = "critico"
    elif normalized_filter == "revisión":
        normalized_filter = "revision"

    alerts: list[dict[str, object]] = []
    for insumo in insumos:
        stock_actual = float(insumo.stock_actual)
        stock_minimo = float(insumo.stock_minimo)
        deficit = round(max(0.0, stock_minimo - stock_actual), 2)
        is_critical = stock_actual < 0.60 * stock_minimo
        estado_alerta = "critico" if is_critical else "revision"

        if normalized_filter in {"critico", "revision"} and (
            estado_alerta != normalized_filter
        ):
            continue

        try:
            pred = calcular_prediccion_insumo(insumo.id, 30, db)
            predicted_days = pred.dias_cobertura
        except Exception:
            predicted_days = None

        dias_agotamiento = _estimate_depletion_days(insumo, predicted_days)

        alerts.append(
            {
                "id": insumo.id,
                "insumo_id": insumo.id,
                "nombre": insumo.nombre,
                "codigo": f"INS-{insumo.id:03d}",
                "categoria": insumo.categoria,
                "unidad": insumo.unidad,
                "stock_actual": round(stock_actual, 2),
                "stock_minimo": round(stock_minimo, 2),
                "deficit": deficit,
                "dias_agotamiento": dias_agotamiento,
                "estado_alerta": estado_alerta,
                "prioridad": "Alta" if is_critical else "Media",
            }
        )

    alerts.sort(
        key=lambda item: (
            0 if item["estado_alerta"] == "critico" else 1,
            int(item["dias_agotamiento"]),
        )
    )

    return alerts[:limit]
