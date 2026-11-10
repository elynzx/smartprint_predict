from datetime import datetime, timezone
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.movimiento import TipoMovimientoEnum


class MovimientoCreate(BaseModel):
    insumo_id: int
    tipo: TipoMovimientoEnum
    cantidad: Decimal = Field(gt=0)
    motivo: str
    proveedor: str | None = None
    documento_referencia: str | None = None
    observaciones: str | None = None
    fecha_operacion: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
