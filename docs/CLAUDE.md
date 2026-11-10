# CLAUDE.md - CONTEXTO SUPREMO Y CONTRATO DE API (SMARTPRINT PREDICT)

Este archivo define la especificación técnica unificada para RESEP S.R.L.

---

## 🛠️ Comandos de Entorno Local

### Backend (Python 3.10+ / FastAPI)
- Crear e iniciar entorno virtual: `python -m venv .venv` && `source .venv/bin/activate` (o `.venv\Scripts\Activate.ps1`)
- Instalar dependencias: `pip install -r requirements.txt`
- Ejecutar Servidor API: `uvicorn main:app --reload --port 8000`
- Migraciones Alembic: `alembic revision --autogenerate -m "descripcion"` && `alembic upgrade head`
- Poblar Base de Datos: `python seed.py`
- Pruebas unitarias: `pytest`

### Frontend (React + Vite + TypeScript)
- Instalar dependencias: `npm ci`
- Servidor de Desarrollo: `npm run dev`
- Compilación a Producción: `npm run build`

---

## 📡 Contrato HTTP JSON para Frontend y Backend

### 1. Autenticación (`/api/auth`)
- `POST /api/auth/login`
  - Request: `{ "email": "admin@resep.pe", "password": "secret_password" }`
  - Response (200): `{ "access_token": "JWT_TOKEN", "token_type": "bearer", "user": { "id": 1, "nombre": "Carlos Méndez", "rol": "administrador" } }`

### 2. Catálogo de Insumos (`/api/insumos`)
- `GET /api/insumos` — `administrador`, `trabajador`.
- `POST /api/insumos` — `administrador`.
- `PATCH /api/insumos/{id}` — `administrador`.

```json
{
  "nombre": "Papel couché",
  "unidad": "resmas",
  "stock_actual": 320,
  "stock_minimo": 350,
  "costo_unitario": 210.00,
  "categoria": "Papel"
}
```

### 3. Kardex y Movimientos (`/api/movimientos`)
- `POST /api/movimientos` — `administrador`, `trabajador`.

```json
{
  "insumo_id": 1,
  "tipo": "SALIDA",
  "cantidad": 50,
  "motivo": "Despacho a taller para Orden de Trabajo OT-4820",
  "documento_referencia": "OT-4820",
  "observaciones": "Impresión de afiches corporativos"
}

```

Si `tipo == "SALIDA"` y `cantidad > stock_actual`, el backend responde HTTP 422 Unprocessable Entity:

```json
{
  "detail": "Stock insuficiente. Stock actual: 320, solicitado: 350."
}

```

### 4. Consulta Cualitativa Comercial (`/api/disponibilidad`)
- `GET /api/disponibilidad?q=couché` — `asesor_comercial`, `administrador`.
- Respuesta cualitativa aislada sin datos sensibles del taller:

```json

[
  {
    "insumo_id": 1,
    "nombre": "Papel couché",
    "unidad": "resmas",
    "estado_disponibilidad": "Disponible",
    "observacion_comercial": "Insumo apto para programación de proyecto"
  },
  {
    "insumo_id": 2,
    "nombre": "Tinta negra",
    "unidad": "litros",
    "estado_disponibilidad": "Stock Limitado",
    "observacion_comercial": "Requiere confirmación de plazo con almacén"
  }
]
```

### 5. Motor Predictivo (/api/prediccion)
- `GET /api/prediccion/{insumo_id}?horizonte=30` — solo `administrador`.

```json
{
  "insumo_id": 1,
  "nombre": "Papel couché",
  "tasa_consumo_diaria": 20.0,
  "dias_cobertura": 16,
  "consumo_estimado_30d": 600,
  "prioridad": "Alta",
  "estado_fisico": "Crítico",
  "metricas_error": {
    "mae": 3.42,
    "rmse": 4.15
  }
}

```
# 🎨 Estilo Visual (React + Tailwind CSS)
- Colores base: Fondo #F4F7FE, Tarjetas #FFFFFF, Texto principal #17233D, Metadatos #75819A.
- Semáforos:
    - Crítico (Rojo): bg-[#FFF0F0] text-[#EF4444]
    - En Riesgo (Ámbar): bg-[#FFF8E7] text-[#F59E0B]
    - Estable (Verde): bg-[#E9FBF5] text-[#10B981]