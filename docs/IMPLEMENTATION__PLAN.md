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

## Checkpoint 4: Frontend Responsivo Basado en Features (React + TypeScript + Tailwind)

- Modularizar el cliente HTTP en `frontend/src/api/client.ts` con manejo centralizado de Bearer JWT.
- Estructurar componentes de layout (`components/layout/MainLayout.tsx`, `Sidebar.tsx`) y UI base (`components/ui/Modal.tsx`, `StatusBadge.tsx`, `LoadingSpinner.tsx`).
- Dividir el frontend en dominios funcionales aislados (`features/`):
  - `features/auth/`: `LoginForm.tsx`, `useAuth.ts`, `types.ts`
  - `features/commercial/`: `CommercialPage.tsx`, `AvailabilityList.tsx`, `commercialService.ts`, `types.ts` (Vista cualitativa `/disponibilidad` exclusiva para `asesor_comercial`)
  - `features/inventory/`: `InventoryPage.tsx`, `InventoryTable.tsx`, `InventoryRow.tsx`, `InsumoFormModal.tsx`, `useInsumos.ts`, `inventoryService.ts`, `types.ts` (Gestión de catálogo, stock mínimo y exportación CSV)
  - `features/movements/`: `MovementsPage.tsx`, `MovementForm.tsx`, `MovementPreviewCard.tsx`, `useKardexMovement.ts`, `movementService.ts`, `types.ts` (Formulario de trazabilidad 2 columnas con validación antinegativa reactiva para `POST /api/movimientos`)
  - `features/predictions/`: `PredictionsPage.tsx`, `PredictionCard.tsx`, `predictionService.ts`, `types.ts` (Gráficos Recharts, MAE/RMSE para `administrador`)
- Configurar enrutamiento declarativo y guardias RBAC por rol en `routes/AppRoutes.tsx` y `routes/ProtectedRoute.tsx`.

## Checkpoint 5: Despliegue y Validación

- Ejecutar migraciones en Supabase mediante `DATABASE_URL` de producción.
- Validar suites de pruebas con `pytest` y compilación frontend con `npm run build`.
