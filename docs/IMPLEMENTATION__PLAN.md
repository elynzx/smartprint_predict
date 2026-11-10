# Plan de Implementación Incremental - SmartPrint Predict

## Checkpoint 0: Estructura del Proyecto y Entorno
- Crear directorios `backend/` y `frontend/`.
- Configurar `.env.example` con `DATABASE_URL=postgresql://postgres:password@localhost:5432/smartprint_db`.
- Definir archivo de inicialización de FastAPI (`main.py`) y servidor de desarrollo Vite en React.

## Checkpoint 1: Persistencia y Kardex Base (PostgreSQL)
- Configurar SQLAlchemy, Alembic y Pydantic v2 en `backend/app/`.
- Crear modelos `Usuario`, `Insumo` y `Movimiento` con Enum de roles: `administrador`, `trabajador`, `asesor_comercial`.
- Implementar validación antinegativa en `POST /api/movimientos` (HTTP 422 si causa stock negativo).
- Escribir `seed.py` para insertar los 3 usuarios de prueba, catálogo inicial de insumos y 60 días de historial de consumo.

## Checkpoint 2: Autenticación JWT y Guards RBAC
- Implementar hash de contraseñas con `passlib/bcrypt` y emisión de tokens en `/api/auth/login`.
- Crear dependencias de FastAPI `get_current_user` y `require_role(...)`.
- Implementar el endpoint `GET /api/disponibilidad` protegido estrictamente para el rol `asesor_comercial` (filtrando campos numéricos y costos).

## Checkpoint 3: Motor Predictivo ML (Scikit-Learn + Pandas)
- Implementar pipeline de preparación de datos agrupadore por días en `backend/app/ml/engine.py`.
- Entrenar modelo de Regresión Lineal sobre movimientos de 'SALIDA'.
- Calcular tasa diaria, días de cobertura restantes y métricas MAE/RMSE.
- Exponer endpoint `GET /api/prediccion/{insumo_id}` con lógica de Prioridad Dinámica (Alta/Media/Baja).

## Checkpoint 4: Frontend Responsivo (React + Tailwind)
- Configurar cliente de API en `frontend/src/api.ts` con manejo de Bearer JWT.
- Implementar vistas por rol: Dashboard e Inventario (`administrador`/`trabajador`) y Factibilidad Comercial (`asesor_comercial`).
- Deshabilitar reactivamente el botón "Registrar" en el formulario de salidas si la cantidad ingresada supera el `stock_actual`.

## Checkpoint 5: Despliegue y Validación
- Ejecutar migraciones en Supabase mediante `DATABASE_URL` de producción.
- Validar suites de pruebas con `pytest` y compilación frontend con `npm run build`.