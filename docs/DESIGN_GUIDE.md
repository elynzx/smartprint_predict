# DESIGN_GUIDE.md — Guía Visual y de Diseño (SmartPrint Predict - v1.0.0)

Este documento especifica la interfaz visual de alta fidelidad para RESEP S.R.L., garantizando legibilidad aumentada para operarios de mayor edad y total fidelidad al prototipo del producto.

---

## 1. Sistema de Colores y Tokens (Tailwind CSS)

- **Fondo General del Sistema:** `#F4F7FE` (`bg-[#F4F7FE]`)
- **Fondo de Tarjetas / Sidebar:** `#FFFFFF` (`bg-white`)
- **Texto Principal (Encabezados y Métricas):** `#17233D` (`text-[#17233D]`)
- **Texto Secundario (Descripciones/Metadatos):** `#75819A` (`text-[#75819A]`)
- **Azul Real (Acción Primaria y Marca):** `#0F52BA` (`bg-[#0F52BA]`, `text-[#0F52BA]`)
- **Azul Claro (Fondo Activo):** `#E9F1FF` (`bg-[#E9F1FF]`)
- **Cian (Acento IA y Proyección):** `#00A4E4` (`text-[#00A4E4]`, `bg-[#00A4E4]`)
- **Borde Estándar:** `#E8EDF5` (`border-[#E8EDF5]`)

### Semáforos de Estado (Badges Redondeados):

- **Crítico (Rojo):** `bg-[#FFF0F0] text-[#EF4444] border border-[#FFF0F0]`
- **En Riesgo / Revisión (Ámbar):** `bg-[#FFF8E7] text-[#F59E0B] border border-[#FFF8E7]`
- **Estable (Verde):** `bg-[#E9FBF5] text-[#10B981] border border-[#E9FBF5]`

---

## 2. Estructura Global (Shell de 2 Columnas)

1. **Sidebar Fijo Izquierdo (`w-[244px] bg-white border-r border-[#E8EDF5]`):**
   - Logo de marca con isotipo "R" azul, título **RESEP** y subtítulo **SmartPrint Predict** (con "Predict" en cian `#00A4E4`).
   - Opciones de menú: Inicio, Inventario, Movimientos, Alertas (con badge circular en rojo `7`), Predicción y Reportes.
   - Pie inferior: Botón de Configuración y Tarjeta de estado `"Predicción IA activa"` con indicador verde parpadeante.

2. **Navbar Superior Fija (`h-[74px] bg-white/80 backdrop-blur-md border-b border-[#E8EDF5]`):**
   - Buscador de `310px` con atajo `⌘ K`.
   - Fecha actual en alta legibilidad: _"Hoy, 09 de octubre de 2026"_.
   - Perfil con avatar azul con siglas **"CM"**, nombre **"Carlos Méndez"** y rol **"Compras"**.

---

## 3. Vistas y Componentes Específicos

- **Factibilidad Comercial (`/disponibilidad`):** Vista cualitativa limpia para `asesor_comercial` que únicamente presenta tarjetas con estado `"Disponible"` (verde) o `"Stock Limitado"` (ámbar), sin números de stock ni costos.
- **Gestión de Inventario (`/inventario`):** Layout en Grid de 4 columnas (75% Tabla principal + 25% Tarjeta lateral de Detalle del insumo seleccionado).
- **Registro de Movimientos (`/movimientos`):** Formulario con Tabs _Entrada/Salida_. Si la cantidad de salida digitada es mayor al stock disponible, se inhabilita el botón "Registrar movimiento" y se pinta el input de rojo.
- **Predicción IA (`/prediccion`):** Gráficos Recharts cruzando la curva real (_Azul Real_) con la estimación futura (_Línea discontinua Cian_), métricas MAE/RMSE y tarjeta de recomendación gerencial.
