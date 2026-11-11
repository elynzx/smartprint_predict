import { Link } from "react-router-dom";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { AlertCard } from "./components/AlertCard";
import { AlertFilterBar } from "./components/AlertFilterBar";
import { IncidentsTimeline } from "./components/IncidentsTimeline";
import { useAlerts } from "./hooks/useAlerts";

export function AlertsPage() {
  const {
    alerts,
    activeFilter,
    criticalCount,
    reviewCount,
    totalCount,
    incidents,
    loading,
    error,
    setActiveFilter,
  } = useAlerts();

  return (
    <div className="inventory-view">
      <header className="inventory-header">
        <div>
          <span className="availability-eyebrow">
            CENTRO DE ALERTAS DE ABASTECIMIENTO
          </span>
          <h1 className="text-[#17233D]">Centro de Alertas de Stock</h1>
          <p className="muted text-[#75819A]">
            Monitoreo en tiempo real de quiebres de stock, cálculo de déficit
            operativo y generación directa de órdenes de reposición.
          </p>
        </div>

        <Link
          to="/app/movements?type=ENTRADA"
          className="btn-primary bg-[#0F52BA] link-btn"
        >
          Registrar ingreso de reposición
        </Link>
      </header>

      <AlertFilterBar
        activeFilter={activeFilter}
        totalCount={totalCount}
        criticalCount={criticalCount}
        reviewCount={reviewCount}
        onSelectFilter={setActiveFilter}
      />

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Evaluando niveles de stock y alertas activas..." />
      ) : (
        <div className="inventory-layout alerts-layout-grid">
          <section
            className="alerts-list-column"
            aria-label="Listado de alertas activas"
          >
            {alerts.length === 0 ? (
              <div className="availability-empty">
                No existen alertas activas para el filtro seleccionado. Todos
                los insumos monitoreados cumplen con el umbral de seguridad.
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertCard key={alert.insumo_id} alert={alert} />
              ))
            )}
          </section>

          <IncidentsTimeline incidents={incidents} />
        </div>
      )}
    </div>
  );
}
