from pydantic import BaseModel


class DisponibilidadResponse(BaseModel):
    insumo_id: int
    nombre: str
    unidad: str
    estado_disponibilidad: str
    observacion_comercial: str
