# CLAUDE.md - CONTEXTO SUPREMO Y CONTRATO DE API (SMARTPRINT PREDICT)

Este archivo define la especificación técnica unificada, reglas de arquitectura y contratos de API para RESEP S.R.L.

---

## Comandos de Entorno Local

### Backend (Python 3.10+ / FastAPI)

- Crear e iniciar entorno virtual: `python -m venv .venv` && `source .venv/bin/activate` (o `.venv\Scripts\Activate.ps1`)
- Instalar dependencias: `pip install -r requirements.txt`
- Ejecutar Servidor API: `uvicorn main:app --reload --port 8000`
- Migraciones Alembic: `alembic revision --autogenerate -m "descripcion"` && `alembic upgrade head`
- Poblar Base de Datos: `python seed.py`
- Ejecutar Pruebas Automatizadas: `pytest`

### Frontend (React 18+ / Vite / TypeScript)

- Instalar dependencias: `npm ci`
- Servidor de Desarrollo: `npm run dev`
- Compilación a Producción: `npm run build`

## Arquitectura del Frontend Basada en Features (`frontend/src/`)

Nomenclatura 100% en inglés para archivos, tipos, hooks y componentes. Textos de Interfaz de Usuario (UI) en español.

```text
frontend/src/
├── api/
│   └── client.ts                      # Base HTTP client (fetch with Bearer token & VITE_API_URL)
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx             # 2-Column Shell Layout (Sidebar + Navbar + Outlet)
│   │   └── Sidebar.tsx                # Left Navigation Sidebar (244px, role-filtered)
│   └── ui/
│       ├── Modal.tsx                  # Generic Modal wrapper (backdrop, ESC close, overlay)
│       ├── StatusBadge.tsx            # Visual semaphores (Crítico, En Riesgo, Estable, Disponible, Stock Limitado)
│       └── LoadingSpinner.tsx         # Accessible loading state indicator
├── context/
│   └── AuthContext.tsx                # Global Auth state, JWT persistence and RBAC session
├── features/
│   ├── alerts/                        # Supply Alert Center (/app/alerts)
│   │   ├── components/                # AlertCard.tsx, AlertFilterBar.tsx, IncidentsTimeline.tsx
│   │   ├── services/                  # alertsService.ts
│   │   └── types.ts
│   ├── auth/                          # Authentication
│   │   ├── components/                # LoginForm.tsx
│   │   ├── hooks/                     # useAuth.ts
│   │   └── types.ts
│   ├── commercial/                    # Isolated Feasibility view (/disponibilidad)
│   │   ├── components/                # AvailabilityList.tsx, AvailabilityCard.tsx
│   │   ├── services/                  # commercialService.ts
│   │   ├── types.ts
│   │   └── CommercialPage.tsx
│   ├── dashboard/                     # Executive Logistical Dashboard (/app/dashboard)
│   │   ├── components/                # KpiGrid.tsx, MainTrendChart.tsx, PriorityInsumosCard.tsx
│   │   ├── services/                  # dashboardService.ts
│   │   └── types.ts
│   ├── inventory/                     # Inventory & Catalog Management (/app/inventory)
│   │   ├── components/                # InventoryTable.tsx, InventoryRow.tsx, InsumoFormModal.tsx
│   │   ├── hooks/                     # useInsumos.ts
│   │   ├── services/                  # inventoryService.ts (CRUD & CSV export)
│   │   ├── types.ts
│   │   └── InventoryPage.tsx
│   ├── movements/                     # Kardex & Traceability Central (/app/movements)
│   │   ├── components/                # MovementForm.tsx, MovementPreviewCard.tsx, MovementHistoryTable.tsx
│   │   ├── hooks/                     # useKardexMovement.ts (Reactive anti-negative validation)
│   │   ├── services/                  # movementService.ts
│   │   ├── types.ts
│   │   └── MovementsPage.tsx
│   ├── predictions/                   # AI Demand Forecasting for Admin (/app/predictions)
│   │   ├── components/                # PredictionChart.tsx, PredictionMetrics.tsx, PredictionAiCard.tsx
│   │   ├── services/                  # predictionService.ts
│   │   ├── types.ts
│   │   └── PredictionsPage.tsx
│   └── users/                         # User Administration Module (/app/users)
│       ├── components/                # UserTable.tsx, UserFormModal.tsx
│       ├── services/                  # userService.ts
│       ├── types.ts
│       └── UsersPage.tsx
├── routes/
│   ├── AppRoutes.tsx                  # Declarative route definitions
│   └── ProtectedRoute.tsx             # RBAC Route Guard by RoleEnum
└── types/
    └── index.ts                       # Shared global types (User, RoleEnum, StatusVariant)

```

## Contrato HTTP JSON Completo

### 1. Autenticación (`/api/auth`)

- `POST /api/auth/login`
  - Request: `{ "email": "admin@resep.pe", "password": "secret_password" }`
  - Response (200): `{ "access_token": "JWT_TOKEN", "token_type": "bearer", "user": { "id": 1, "nombre": "Carlos Méndez", "rol": "administrador" } }`

### 2. Catálogo de Insumos (`/api/insumos`)

- `GET /api/insumos` — `administrador`, `trabajador`.
- `POST /api/insumos` — `administrador` (Permite registrar `stock_actual` inicial).
- `PATCH /api/insumos/{id}` — `administrador` (`stock_actual` es de solo lectura en edición; solo se modifican datos de catálogo).

```
{
  "nombre": "Papel couché 150g - A3",
  "unidad": "resmas",
  "stock_actual": 320,
  "stock_minimo": 350,
  "costo_unitario": 210.00,
  "categoria": "Papel",
  "proveedor": "Papelera Andina S.A."
}
```

### 3. Kardex y Movimientos (`/api/movimientos`)

- `GET /api/movimientos?page=1&limit=10&insumo_id=1&tipo=SALIDA` — `administrador`, `trabajador`.
- `POST /api/movimientos` — `administrador`, `trabajador`.

```
{
  "insumo_id": 1,
  "tipo": "SALIDA",
  "cantidad": 50,
  "motivo": "Despacho a taller para Orden de Trabajo OT-4820",
  "documento_referencia": "OT-4820",
  "observaciones": "Impresión de afiches corporativos"
}
```

_Si `tipo == "SALIDA"` y `cantidad > stock_actual`, el backend responde HTTP 422 Unprocessable Entity:_

```
{
  "detail": "Stock insuficiente. Stock actual: 320, solicitado: 350."
}
```

### 4. Consulta Cualitativa Comercial (`/api/disponibilidad`)

- `GET /api/disponibilidad?q=couché` — `asesor_comercial`, `administrador`.

```
[
  {
    "insumo_id": 1,
    "nombre": "Papel couché 150g - A3",
    "unidad": "resmas",
    "estado_disponibilidad": "Disponible",
    "observacion_comercial": "Insumo apto para programación de proyecto"
  },
  {
    "insumo_id": 2,
    "nombre": "Tinta negra offset",
    "unidad": "litros",
    "estado_disponibilidad": "Stock Limitado",
    "observacion_comercial": "Requiere confirmación de plazo con almacén"
  }
]
```

### 5. Motor Predictivo (`/api/prediccion`)

- `GET /api/prediccion/{insumo_id}?horizonte=30|60|90` — solo `administrador`.

```
{
  "insumo_id": 1,
  "nombre": "Papel couché 150g - A3",
  "tasa_consumo_diaria": 14.88,
  "dias_cobertura": 7,
  "consumo_estimado": 446.53,
  "consumo_estimado_30d": 446.53,
  "prioridad": "Alta",
  "estado_fisico": "Crítico",
  "metricas_error": {
    "mae": 41.76,
    "rmse": 108.40
  },
  "observacion": "proyección calculada"
}
```

### 6. Alertas de Abastecimiento (`/api/alertas`)

- `GET /api/alertas?estado=critico|revision` — `administrador`, `trabajador`.

### 7. Gestión de Usuarios (`/api/usuarios`)

- `GET /api/usuarios` — solo `administrador`.
- `POST /api/usuarios` — solo `administrador`.
- `PATCH /api/usuarios/{id}` — solo `administrador` (Modificación de rol o estado activo/inactivo).
