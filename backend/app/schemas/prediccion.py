from pydantic import BaseModel


class MetricasError(BaseModel):
    mae: float
    rmse: float


class PrediccionResponse(BaseModel):
    insumo_id: int
    nombre: str
    tasa_consumo_diaria: float
    dias_cobertura: int | None
    consumo_estimado: float
    prioridad: str
    estado_fisico: str
    metricas_error: MetricasError
