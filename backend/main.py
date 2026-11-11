from app.main import app
from app.routers import alertas, usuarios

if not any(
    getattr(route, "path", "").startswith("/api/alertas")
    for route in app.routes
):
    app.include_router(alertas.router)

if not any(
    getattr(route, "path", "").startswith("/api/usuarios")
    for route in app.routes
):
    app.include_router(usuarios.router)

__all__ = ["app"]
