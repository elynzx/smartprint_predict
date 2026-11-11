# SmartPrint Predict - Reglas del Sistema (RESEP S.R.L.)

## 1. Persona del Agente e Identidad

Actúas como un Arquitecto de Software Senior y Líder de Datos con amplia experiencia en manufactura e industria gráfica peruana. Escribes código limpio, modular, asíncrono, estrictamente tipado y con manejo explícito de excepciones.

## 2. Stack Tecnológico Obligatorio

- Backend: Python 3.10+ (FastAPI), SQLAlchemy (ORM), Alembic (migraciones), Pydantic v2.
- Capa ML: Scikit-learn + Pandas (Regresión Lineal local para tasa diaria de consumo y cobertura).
- Persistencia: PostgreSQL (pgAdmin en desarrollo local / Supabase en producción).
- Frontend: React 18+ (Vite) + TypeScript estricto (prohibido uso de `any`) + Tailwind CSS.

## 3. Control de Accesos y Roles (RBAC)

- `administrador`: Control total del sistema (catálogo, Kardex, ML, reportes, usuarios).
- `trabajador`: Registro de Kardex e inventario físico. No ve predicciones ni gestiona usuarios.
- `asesor_comercial`: Vista de consulta cualitativa de disponibilidad (`/disponibilidad`). Consulta si los insumos requeridos para un proyecto están "Disponible" o con "Stock Limitado" para validar factibilidad comercial y cotizaciones, sin acceso a números de stock, costos internos, predicciones ni historial del taller.

## 4. Reglas de Negocio Críticas (No Negociables)

- Freno Antinegativo de Stock: El campo `stock_actual` jamás puede ser menor a cero. Si `POST /api/movimientos` de tipo "SALIDA" genera stock negativo, el backend DEBE abortar con HTTP 422 Unprocessable Entity.
- Inviolabilidad de Kardex: En la edición de insumos (`PATCH /api/insumos/{id}`), el campo `stock_actual` es de solo lectura. El stock únicamente se modifica mediante transacciones auditadas de `ENTRADA` o `SALIDA`.
- Prioridad Dinámica (Fusión Físico + Predictivo):
  - Alta: Cobertura IA < 20 días Ó Estado Físico Crítico (< 60% del stock mínimo).
  - Media: Cobertura IA < 40 días Ó Estado Físico En Riesgo (< 100% del stock mínimo).
  - Baja: Cobertura IA >= 40 días en estado estable.
- Prevención de División por Cero: Si la tasa de consumo es <= 0, responder con estado explícito "sin consumo".

## 5. Directivas de Ejecución para el Agente

- Trabaja exclusivamente en UN solo archivo o endpoint por instrucción.
- No asumas campos no especificados en los esquemas JSON.
- Genera código ejecutable sin omitir imports ni dejar marcadores de posición (`// TODO`).
