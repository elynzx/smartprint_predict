from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import DbSession, require_roles
from app.ml.engine import calcular_prediccion_insumo
from app.models.usuario import Usuario
from app.schemas.prediccion import PrediccionResponse

router = APIRouter(prefix="/api/prediccion", tags=["prediccion"])


@router.get("/{insumo_id}", response_model=PrediccionResponse, status_code=status.HTTP_200_OK)
def get_prediccion(
    insumo_id: int,
    db: DbSession,
    _: Annotated[Usuario, Depends(require_roles(["administrador"]))],
    horizonte: Annotated[int, Query(ge=1, le=365)] = 30,
) -> PrediccionResponse:
    try:
        result = calcular_prediccion_insumo(insumo_id, horizonte, db)
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
        consumo_estimado_30d=result.consumo_estimado_30d,
        prioridad=result.prioridad,
        estado_fisico=result.estado_fisico,
        metricas_error=result.metricas_error,
        observacion=result.observacion,
    )
