

# SmartPrint Predict

Sistema web full-stack para gestionar inventario de insumos gráficos, registrar movimientos y consultar la disponibilidad comercial de RESEP S.R.L. El backend incorpora un motor de predicción de demanda con `pandas` y `scikit-learn`.

## Características

- Autenticación mediante JWT y autorización basada en roles.
- Catálogo de insumos con control de existencias.
- Registro de entradas y salidas de inventario.
- Protección contra stock negativo.
- Alertas de reabastecimiento y predicción de consumo.
- Consulta comercial cualitativa sin exponer costos ni cantidades de stock.
- Documentación interactiva de la API mediante Swagger UI.
- Datos sintéticos de demostración generados por `seed.py`.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Backend | Python 3.10+, FastAPI, Pydantic 2, SQLAlchemy 2 |
| Base de datos | PostgreSQL, `psycopg` |
| Seguridad | JWT, `passlib` y `bcrypt` |
| Machine Learning | `pandas`, `scikit-learn` |
| Frontend | React 18, TypeScript, Vite, React Router |

## Estructura

```text
smartprint-project/
├── backend/
│   ├── app/
│   │   ├── core/       # Configuración, base de datos, seguridad y dependencias
│   │   ├── ml/         # Motor de predicción y métricas
│   │   ├── models/     # Modelos SQLAlchemy (Usuario, Insumo, Movimiento)
│   │   ├── routers/    # Endpoints de la API (/auth, /insumos, /movimientos, /prediccion, /disponibilidad)
│   │   └── schemas/    # Esquemas Pydantic
│   ├── main.py         # Punto de entrada de Uvicorn
│   ├── requirements.txt
│   └── seed.py         # Poblado de datos con 60 días de historial
├── docs/               # Especificaciones y guías del proyecto
├── frontend/
│   ├── src/
│   │   ├── components/ # Navbar, Sidebar y componentes compartidos
│   │   ├── context/    # Estado de autenticación
│   │   ├── layouts/    # Layout principal
│   │   └── pages/      # Login, disponibilidad y vistas en desarrollo
│   └── package.json
├── .env.example
└── README.md
```
        

## Requisitos

- Python 3.10 o superior.
- Node.js 18 o superior y npm.
- PostgreSQL 14 o superior.

## Puesta en marcha

### 1. Configurar PostgreSQL

Crea una base de datos vacía, por ejemplo `smartprint_db`, y verifica que el usuario configurado tenga permisos de conexión y escritura.

### 2. Configurar el backend

Desde la raíz del proyecto:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copia `.env.example` a `.env` en la raíz del proyecto y configura al menos:

```dotenv
DATABASE_URL=postgresql+psycopg://usuario:contraseña@localhost:5432/smartprint_db
SECRET_KEY=cambiar-esta-clave
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:5173"]
```

> En PowerShell, si la política de ejecución bloquea la activación del entorno virtual, puedes ejecutar el intérprete directamente con `.\.venv\Scripts\python.exe`.

El script de seed crea las tablas mediante SQLAlchemy, elimina los datos existentes y genera usuarios, insumos y 60 días de historial sintético:

```powershell
python seed.py
uvicorn main:app --reload --port 8000
```

> `seed.py` reinicia los datos de las tablas de usuarios, insumos y movimientos. No lo ejecutes sobre una base de datos con información que quieras conservar.

### 3. Configurar el frontend

En otra terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

La aplicación estará disponible en <http://localhost:5173>.

### Comandos útiles

| Objetivo | Comando | Directorio |
| --- | --- | --- |
| Ejecutar frontend | `npm run dev` | `frontend` |
| Compilar frontend | `npm run build` | `frontend` |
| Previsualizar compilación | `npm run preview` | `frontend` |
| Ejecutar API | `uvicorn main:app --reload --port 8000` | `backend` |
| Ejecutar pruebas Python | `pytest` | `backend` |

## Usuarios de prueba

Los usuarios se crean al ejecutar `python seed.py`:

| Rol | Email | Contraseña | Acceso principal |
| --- | --- | --- | --- |
| Administrador | `admin@resep.pe` | `Admin2026!` | Operación completa |
| Trabajador | `trabajador@resep.pe` | `Trabajador2026!` | Inventario y movimientos |
| Asesor comercial | `ventas@resep.pe` | `Ventas2026!` | Disponibilidad comercial |

Estas credenciales son únicamente para desarrollo local. Cámbialas antes de desplegar el sistema.

## API

Con el backend iniciado:

- Health check: <http://localhost:8000/health>
- Swagger UI: <http://localhost:8000/docs>
- Especificación OpenAPI: <http://localhost:8000/openapi.json>

Rutas principales:

| Recurso | Ruta |
| --- | --- |
| Autenticación | `/api/auth/login` |
| Insumos | `/api/insumos` |
| Movimientos | `/api/movimientos` |
| Predicción | `/api/prediccion/{insumo_id}` |
| Alertas | `/api/alertas` |
| Disponibilidad comercial | `/api/disponibilidad` |

## Roles y permisos

- **`administrador`**: gestiona insumos, movimientos, predicciones, alertas y disponibilidad comercial.
- **`trabajador`**: consulta inventario y registra entradas o salidas.
- **`asesor_comercial`**: consulta únicamente la disponibilidad comercial, sin costos, cantidades de stock ni predicciones.

## Reglas de negocio

- Una salida que supera el stock disponible se rechaza con `HTTP 422`; el stock nunca puede ser negativo.
- La prioridad combina cobertura estimada y estado físico del inventario.
- Cuando no existe consumo diario, la predicción informa explícitamente `sin consumo` y evita divisiones por cero.

## Documentación del proyecto

- [`docs/CLAUDE.md`](docs/CLAUDE.md): contrato de API y comandos de desarrollo.
- [`docs/DESIGN_GUIDE.md`](docs/DESIGN_GUIDE.md): guía visual.
- [`docs/IMPLEMENTATION__PLAN.md`](docs/IMPLEMENTATION__PLAN.md): plan de implementación.
- [`docs/SYSTEM_PROMPT.md`](docs/SYSTEM_PROMPT.md): contexto para asistentes de desarrollo.

## Metodología

Proyecto académico desarrollado con **Spec-Driven Development (SDD)** y asistencia de inteligencia artificial, manteniendo la trazabilidad entre las especificaciones y la implementación técnica.
