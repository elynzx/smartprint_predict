from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.movimiento import Movimiento


class Insumo(Base):
    __tablename__ = "insumos"
    __table_args__ = (
        CheckConstraint(
            "stock_actual >= 0", name="ck_insumos_stock_actual_nonnegative"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    unidad: Mapped[str] = mapped_column(String(50), nullable=False)
    stock_actual: Mapped[Decimal] = mapped_column(
        Numeric(12, 3), nullable=False, default=0
    )
    stock_minimo: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    categoria: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    movimientos: Mapped[list["Movimiento"]] = relationship(back_populates="insumo")
