from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import DbSession, require_roles
from app.ml.engine import calcular_prediccion_insumo
from app.models.usuario import Usuario
from app.schemas.prediccion import PrediccionResponse

router = APIRouter(prefix="/api/prediccion", tags=["prediccion"])


@router.get("/{insumo_id}", response_model=PrediccionResponse)
def get_prediccion(
    insumo_id: int,
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
    horizonte: Annotated[Literal[30, 60, 90], Query()] = 30,
) -> PrediccionResponse:
    try:
        result = calcular_prediccion_insumo(insumo_id, horizonte, db)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)
        ) from error
    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    return PrediccionResponse(
        insumo_id=result.insumo_id,
        nombre=result.nombre,
        tasa_consumo_diaria=result.tasa_consumo_diaria,
        dias_cobertura=result.dias_cobertura,
        consumo_estimado=result.consumo_estimado,
        prioridad=result.prioridad,
        estado_fisico=result.estado_fisico,
        metricas_error=result.metricas_error,
    )
