from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InsumoCreate(BaseModel):
    nombre: str
    unidad: str
    stock_actual: Decimal = Field(ge=0)
    stock_minimo: Decimal = Field(ge=0)
    costo_unitario: Decimal = Field(ge=0)
    categoria: str
    proveedor: str | None = None
    proveedor_referencial: str | None = None


class InsumoUpdate(BaseModel):
    nombre: str | None = None
    unidad: str | None = None
    stock_minimo: Decimal | None = Field(default=None, ge=0)
    costo_unitario: Decimal | None = Field(default=None, ge=0)
    categoria: str | None = None
    proveedor: str | None = None
    proveedor_referencial: str | None = None


class InsumoResponse(InsumoCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
