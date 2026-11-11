import csv
import io
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select

from app.core.deps import DbSession, require_roles
from app.models.insumo import Insumo
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


def _estado_fisico(stock_actual: float, stock_minimo: float) -> str:
    if stock_minimo > 0 and stock_actual < 0.60 * stock_minimo:
        return "Crítico"
    if stock_actual < stock_minimo:
        return "En Riesgo"
    return "Estable"


@router.get("/inventario.csv")
def export_inventario_csv(
    db: DbSession,
    _: Annotated[
        Usuario, Depends(require_roles(["administrador", "trabajador"]))
    ],
) -> Response:
    insumos = db.scalars(
        select(Insumo).where(Insumo.activo.is_(True)).order_by(Insumo.id)
    ).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "ID",
            "Codigo",
            "Nombre",
            "Categoria",
            "Unidad",
            "Stock_Actual",
            "Stock_Minimo",
            "Costo_Unitario_PEN",
            "Estado",
        ]
    )

    for insumo in insumos:
        actual = float(insumo.stock_actual)
        minimo = float(insumo.stock_minimo)
        costo = float(insumo.costo_unitario)
        writer.writerow(
            [
                insumo.id,
                f"INS-{insumo.id:03d}",
                insumo.nombre,
                insumo.categoria,
                insumo.unidad,
                f"{actual:g}",
                f"{minimo:g}",
                f"{costo:.2f}",
                _estado_fisico(actual, minimo),
            ]
        )

    csv_content = "\ufeff" + buffer.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="inventario_resep.csv"'
        },
    )
