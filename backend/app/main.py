from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    alertas,
    auth,
    disponibilidad,
    insumos,
    movimientos,
    prediccion,
    reportes,
)

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(disponibilidad.router)
app.include_router(insumos.router)
app.include_router(movimientos.router)
app.include_router(prediccion.router)
app.include_router(alertas.router)
app.include_router(reportes.router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
