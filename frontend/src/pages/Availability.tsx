import { useEffect, useState } from "react";
import { getAvailabilityStatus, type ItemAvailability } from "../api";
import { useAuth } from "../context/AuthContext";

function getCategoryFromName(nombre: string, categoria?: string): string {
  if (categoria && categoria.trim().length > 0) {
    return categoria;
  }
  const lower = nombre.toLowerCase();
  if (lower.includes("papel")) return "Papel";
  if (lower.includes("tinta")) return "Tintas";
  if (lower.includes("plancha")) return "Planchas";
  if (lower.includes("solvente") || lower.includes("químico"))
    return "Químicos";
  return "Insumos";
}

function formatUnit(unidad: string): string {
  const normalized = unidad.trim().toLowerCase();
  const singularMap: Record<string, string> = {
    resmas: "Resma",
    resma: "Resma",
    litros: "Litro",
    litro: "Litro",
    unidades: "Unidad",
    unidad: "Unidad",
    pliegos: "Pliego",
    pliego: "Pliego",
    rollos: "Rollo",
    rollo: "Rollo",
    galones: "Galón",
    galon: "Galón",
  };
  if (singularMap[normalized]) {
    return singularMap[normalized];
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getCommercialNote(item: ItemAvailability): string {
  if (item.estado_disponibilidad === "Disponible") {
    return item.observacion_comercial || "Apto para programación de proyecto";
  }
  return (
    item.observacion_comercial || "Requiere confirmación de plazo con almacén"
  );
}

export function AvailabilityView() {
  const { token } = useAuth();
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [items, setItems] = useState<ItemAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError("");

    getAvailabilityStatus(token, debouncedQuery)
      .then((data) => {
        if (active) {
          setItems(data);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setItems([]);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo consultar la disponibilidad comercial.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token, debouncedQuery]);

  return (
    <div className="availability-view">
      <header className="availability-header">
        <div>
          <span className="availability-eyebrow">
            VISTA DE ASESORÍA COMERCIAL
          </span>
          <h1 className="text-[#17233D]">Factibilidad Comercial</h1>
          <p className="muted text-[#75819A]">
            Consulta cualitativa en tiempo real sobre el estado de insumos para
            cotizaciones y programación de órdenes de trabajo.
          </p>
        </div>

        <div className="availability-legend">
          <span className="legend-pill bg-[#E9FBF5] text-[#10B981]">
            <i className="status-dot dot-good" /> Disponible: Apto para
            programación de proyecto
          </span>
          <span className="legend-pill bg-[#FFF8E7] text-[#F59E0B]">
            <i className="status-dot dot-warning" /> Stock Limitado: Requiere
            confirmación de plazo con almacén
          </span>
        </div>
      </header>

      <div className="availability-toolbar">
        <div className="availability-search-box">
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="availability-search-input"
            placeholder="Buscar insumo por nombre o categoría (ej. Papel couché, Tintas, Planchas)..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar insumo"
          />
          {query && (
            <button
              type="button"
              className="availability-clear-btn"
              onClick={() => setQuery("")}
              title="Limpiar búsqueda"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="availability-empty">
          Consultando disponibilidad de insumos en planta...
        </div>
      ) : items.length === 0 ? (
        <div className="availability-empty">
          No se encontraron insumos que coincidan con{" "}
          <strong>"{debouncedQuery}"</strong>.
        </div>
      ) : (
        <div className="availability-grid">
          {items.map((item) => {
            const isDisponible = item.estado_disponibilidad === "Disponible";
            const categoria = getCategoryFromName(item.nombre, item.categoria);
            const unidadFormateada = formatUnit(item.unidad);
            const notaComercial = getCommercialNote(item);

            return (
              <article
                key={item.insumo_id}
                className="availability-card bg-white border border-[#E8EDF5] rounded-[12px]"
              >
                <div className="availability-card-top">
                  <span className="availability-meta-chip">
                    {categoria} / {unidadFormateada}
                  </span>
                  <span
                    className={
                      isDisponible
                        ? "status good bg-[#E9FBF5] text-[#10B981] border border-[#E9FBF5]"
                        : "status warning bg-[#FFF8E7] text-[#F59E0B] border border-[#FFF8E7]"
                    }
                  >
                    <i
                      className={
                        isDisponible
                          ? "status-dot dot-good"
                          : "status-dot dot-warning"
                      }
                    />
                    {item.estado_disponibilidad}
                  </span>
                </div>

                <h2 className="availability-title text-[#17233D]">
                  {item.nombre}
                </h2>

                <dl className="availability-specs">
                  <div>
                    <dt>Categoría</dt>
                    <dd>{categoria}</dd>
                  </div>
                  <div>
                    <dt>Unidad de medida</dt>
                    <dd>{unidadFormateada}</dd>
                  </div>
                </dl>

                <div
                  className={
                    isDisponible
                      ? "availability-note note-good"
                      : "availability-note note-warning"
                  }
                >
                  <span className="availability-note-label">
                    Orientación comercial
                  </span>
                  <p>{notaComercial}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AvailabilityView;
