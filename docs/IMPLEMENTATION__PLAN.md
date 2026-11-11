# Plan de Implementación Incremental - SmartPrint Predict

## Checkpoint 0: Estructura del Proyecto y Entorno

- Configurar directorios `backend/` y `frontend/`.
- Configurar variables de entorno `.env` con soporte para PostgreSQL local (pgAdmin) y producción (Supabase).
- Inicialización de FastAPI (`main.py`) y cliente Vite con React + TypeScript.

## Checkpoint 1: Persistencia Relacional y Kardex Base

- Definir modelos SQLAlchemy (`Usuario`, `Insumo`, `Movimiento`) y esquemas Pydantic v2.
- Implementar validación antinegativa en `POST /api/movimientos` (HTTP 422 si causa stock negativo).
- Implementar `seed.py` para poblar la base de datos con usuarios base por rol, catálogo inicial e historial sintético de 60 días de consumo.

## Checkpoint 2: Autenticación JWT y RBAC por Roles

- Emisión de tokens JWT con hash Bcrypt en `/api/auth/login`.
- Implementar dependencias `get_current_user` y `require_roles(...)`.
- Crear endpoint `GET /api/disponibilidad` protegido para el rol `asesor_comercial` (vista cualitativa sin cifras numéricas ni costos).

## Checkpoint 3: Motor Predictivo ML (Scikit-Learn + Pandas)

- Implementar pipeline de análisis en `backend/app/ml/engine.py` (Regresión Lineal sobre salidas de taller).
- Calcular tasa de consumo diaria, días de cobertura ($stock / tasa$), métricas MAE/RMSE y manejar estados "sin consumo" para tasa $\le 0$.
- Exponer `GET /api/prediccion/{insumo_id}` asignando Prioridad Dinámica (Alta < 20d/Crítico, Media < 40d/En Riesgo, Baja $\ge$ 40d).

## Checkpoint 4: Frontend Responsivo Basado en Features

- Construir arquitectura basada en dominios en `frontend/src/features/` con nomenclatura 100% en inglés y textos UI en español.
- Vistas implementadas: Factibilidad Comercial (`commercial/`), Inventario (`inventory/`), Registro de Movimientos (`movements/`), Predicción IA (`predictions/`), Alertas (`alerts/`), Dashboard (`dashboard/`) y Usuarios (`users/`).
- Integración de validación antinegativa reactiva en formulario de salidas e inhabilitación de botones.
- Implementación de paginación en el historial de Kardex y menú de perfil en Navbar con Logout seguro.

## Checkpoint 5: Suite de Pruebas Automatizadas y Despliegue Cloud

- Implementación de pruebas unitarias y de integración con `pytest` en backend (RBAC, freno antinegativo y modelo predictivo).
- Validación de despliegue en Supabase y verificación de compilación en producción (`npm run build`).
