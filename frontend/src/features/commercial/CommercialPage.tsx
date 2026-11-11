import { useEffect, useState } from "react";
import { useAuth } from "../auth/hooks/useAuth";
import { AvailabilityList } from "./components/AvailabilityList";
import { fetchCommercialAvailability } from "./services/commercialService";
import type { CommercialSupplyItem } from "./types";

export function CommercialPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [items, setItems] = useState<CommercialSupplyItem[]>([]);
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

    let isMounted = true;
    setIsLoading(true);
    setError("");

    fetchCommercialAvailability(token, debouncedQuery)
      .then((data) => {
        if (isMounted) {
          setItems(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setItems([]);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo consultar la disponibilidad comercial.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
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

      <AvailabilityList
        items={items}
        isLoading={isLoading}
        searchTerm={debouncedQuery}
      />
    </div>
  );
}
