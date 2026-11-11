from typing import Optional

from pydantic import BaseModel


class MetricasError(BaseModel):
    mae: float
    rmse: float


class PrediccionResponse(BaseModel):
    insumo_id: int
    nombre: str
    tasa_consumo_diaria: float
    dias_cobertura: Optional[int] = None
    consumo_estimado: float = 0.0
    consumo_estimado_30d: float = 0.0
    prioridad: str
    estado_fisico: str
    metricas_error: dict[str, float]
    observacion: Optional[str] = None
