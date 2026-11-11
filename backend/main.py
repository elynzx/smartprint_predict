from app.main import app
from app.routers import alertas

if not any(
    getattr(route, "path", "").startswith("/api/alertas")
    for route in app.routes
):
    app.include_router(alertas.router)

__all__ = ["app"]
