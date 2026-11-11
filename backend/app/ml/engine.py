from dataclasses import dataclass
from datetime import date

import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.insumo import Insumo
from app.models.movimiento import Movimiento, TipoMovimientoEnum


@dataclass(frozen=True)
class PredictionResult:
    insumo_id: int
    nombre: str
    tasa_consumo_diaria: float
    dias_cobertura: int | None
    consumo_estimado: float
    consumo_estimado_30d: float
    prioridad: str
    estado_fisico: str
    metricas_error: dict[str, float]
    observacion: str | None = None


def _estado_fisico(stock_actual: float, stock_minimo: float) -> str:
    if stock_minimo > 0 and stock_actual < 0.60 * stock_minimo:
        return "Crítico"
    if stock_actual < stock_minimo:
        return "En Riesgo"
    return "Estable"


def _prioridad(dias_cobertura: int | None, estado_fisico: str) -> str:
    if estado_fisico == "Crítico" or (
        dias_cobertura is not None and dias_cobertura < 20
    ):
        return "Alta"
    if estado_fisico == "En Riesgo" or (
        dias_cobertura is not None and dias_cobertura < 40
    ):
        return "Media"
    return "Baja"


def _empty_prediction(
    insumo: Insumo,
    estado_fisico: str,
    mae: float = 0.0,
    rmse: float = 0.0,
) -> PredictionResult:
    return PredictionResult(
        insumo_id=insumo.id,
        nombre=insumo.nombre,
        tasa_consumo_diaria=0.0,
        dias_cobertura=None,
        consumo_estimado=0.0,
        consumo_estimado_30d=0.0,
        prioridad=_prioridad(None, estado_fisico),
        estado_fisico=estado_fisico,
        metricas_error={"mae": round(mae, 4), "rmse": round(rmse, 4)},
        observacion="sin consumo suficiente",
    )


def calcular_prediccion_insumo(
    insumo_id: int, horizonte_dias: int, db: Session
) -> PredictionResult:
    effective_horizon = horizonte_dias if horizonte_dias in {30, 60, 90} else 30

    insumo = db.get(Insumo, insumo_id)
    if insumo is None or not insumo.activo:
        raise LookupError("Insumo no encontrado.")

    stock_actual = float(insumo.stock_actual)
    stock_minimo = float(insumo.stock_minimo)
    estado_fisico = _estado_fisico(stock_actual, stock_minimo)

    movimientos = db.scalars(
        select(Movimiento)
        .where(
            Movimiento.insumo_id == insumo_id,
            Movimiento.tipo == TipoMovimientoEnum.SALIDA,
        )
        .order_by(Movimiento.fecha_operacion)
    ).all()

    if len(movimientos) < 2:
        return _empty_prediction(insumo, estado_fisico)

    try:
        frame = pd.DataFrame(
            {
                "fecha": [movement.fecha_operacion.date() for movement in movimientos],
                "cantidad": [float(movement.cantidad) for movement in movimientos],
            }
        )
        daily_consumption = (
            frame.groupby("fecha", as_index=False)[["cantidad"]]
            .sum()
            .sort_values(by="fecha")
        )

        if len(daily_consumption) < 2:
            return _empty_prediction(insumo, estado_fisico)

        daily_consumption["consumo_acumulado"] = daily_consumption["cantidad"].cumsum()
        first_day: date = daily_consumption["fecha"].iloc[0]
        daily_consumption["dias_desde_inicio"] = (
            pd.to_datetime(daily_consumption["fecha"]) - pd.Timestamp(first_day)
        ).dt.days

        x = daily_consumption[["dias_desde_inicio"]]
        y = daily_consumption["consumo_acumulado"]
        model = LinearRegression().fit(x, y)
        tasa = max(float(model.coef_[0]), 0.0)
        predictions = model.predict(x)
        mae = float(mean_absolute_error(y, predictions))
        rmse = float(mean_squared_error(y, predictions) ** 0.5)
    except (AttributeError, IndexError, KeyError, TypeError, ValueError):
        return _empty_prediction(insumo, estado_fisico)

    if tasa <= 0:
        return _empty_prediction(insumo, estado_fisico, mae=mae, rmse=rmse)

    dias_cobertura = int(stock_actual / tasa)
    consumo_estimado = round(tasa * effective_horizon, 2)
    consumo_estimado_30d = round(tasa * 30, 2)

    return PredictionResult(
        insumo_id=insumo.id,
        nombre=insumo.nombre,
        tasa_consumo_diaria=round(tasa, 4),
        dias_cobertura=dias_cobertura,
        consumo_estimado=consumo_estimado,
        consumo_estimado_30d=consumo_estimado_30d,
        prioridad=_prioridad(dias_cobertura, estado_fisico),
        estado_fisico=estado_fisico,
        metricas_error={"mae": round(mae, 4), "rmse": round(rmse, 4)},
        observacion="proyección calculada",
    )
