from dataclasses import dataclass
from datetime import date
from decimal import Decimal

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
    prioridad: str
    estado_fisico: str
    metricas_error: dict[str, float]


def _estado_fisico(stock_actual: float, stock_minimo: float) -> str:
    if stock_actual < 0.60 * stock_minimo:
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


def _empty_prediction(insumo: Insumo, estado_fisico: str) -> PredictionResult:
    return PredictionResult(
        insumo_id=insumo.id,
        nombre=insumo.nombre,
        tasa_consumo_diaria=0.0,
        dias_cobertura=None,
        consumo_estimado=0.0,
        prioridad=_prioridad(None, estado_fisico),
        estado_fisico=estado_fisico,
        metricas_error={"mae": 0.0, "rmse": 0.0},
    )


def calcular_prediccion_insumo(
    insumo_id: int, horizonte_dias: int, db: Session
) -> PredictionResult:
    if horizonte_dias not in {30, 60, 90}:
        raise ValueError("El horizonte debe ser 30, 60 o 90 días.")

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
    if not movimientos:
        return _empty_prediction(insumo, estado_fisico)

    frame = pd.DataFrame(
        {
            "fecha": [movement.fecha_operacion.date() for movement in movimientos],
            "cantidad": [float(movement.cantidad) for movement in movimientos],
        }
    )
    daily_consumption = (
        frame.groupby("fecha", as_index=False)["cantidad"].sum().sort_values("fecha")
    )
    daily_consumption["consumo_acumulado"] = daily_consumption["cantidad"].cumsum()
    first_day: date = daily_consumption["fecha"].iloc[0]
    daily_consumption["dias_desde_inicio"] = (
        pd.to_datetime(daily_consumption["fecha"])
        - pd.Timestamp(first_day)
    ).dt.days

    x = daily_consumption[["dias_desde_inicio"]]
    y = daily_consumption["consumo_acumulado"]
    model = LinearRegression().fit(x, y)
    tasa = max(float(model.coef_[0]), 0.0)
    predictions = model.predict(x)
    mae = float(mean_absolute_error(y, predictions))
    rmse = float(mean_squared_error(y, predictions) ** 0.5)

    if tasa <= 0:
        return PredictionResult(
            insumo_id=insumo.id,
            nombre=insumo.nombre,
            tasa_consumo_diaria=0.0,
            dias_cobertura=None,
            consumo_estimado=0.0,
            prioridad=_prioridad(None, estado_fisico),
            estado_fisico=estado_fisico,
            metricas_error={"mae": mae, "rmse": rmse},
        )

    dias_cobertura = int(stock_actual / tasa)
    consumo_estimado = tasa * horizonte_dias
    return PredictionResult(
        insumo_id=insumo.id,
        nombre=insumo.nombre,
        tasa_consumo_diaria=tasa,
        dias_cobertura=dias_cobertura,
        consumo_estimado=consumo_estimado,
        prioridad=_prioridad(dias_cobertura, estado_fisico),
        estado_fisico=estado_fisico,
        metricas_error={"mae": mae, "rmse": rmse},
    )
