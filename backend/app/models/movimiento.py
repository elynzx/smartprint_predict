from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.insumo import Insumo
    from app.models.usuario import Usuario


class TipoMovimientoEnum(str, PyEnum):
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"


class Movimiento(Base):
    __tablename__ = "movimientos"
    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_movimientos_cantidad_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    insumo_id: Mapped[int] = mapped_column(
        ForeignKey("insumos.id"), nullable=False, index=True
    )
    tipo: Mapped[TipoMovimientoEnum] = mapped_column(
        Enum(TipoMovimientoEnum, name="tipo_movimiento_enum", native_enum=False),
        nullable=False,
    )
    cantidad: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    motivo: Mapped[str] = mapped_column(String(255), nullable=False)
    proveedor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    documento_referencia: Mapped[str | None] = mapped_column(String(100), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_operacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False, index=True
    )

    insumo: Mapped["Insumo"] = relationship(back_populates="movimientos")
    usuario: Mapped["Usuario"] = relationship(back_populates="movimientos")
