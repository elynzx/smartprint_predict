import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useAuth } from "../auth/hooks/useAuth";
import { CategoryDistributionChart } from "./components/CategoryDistributionChart";
import { KpiGrid } from "./components/KpiGrid";
import { MainTrendChart } from "./components/MainTrendChart";
import { PriorityInsumosCard } from "./components/PriorityInsumosCard";
import { getDashboardSummary } from "./services/dashboardService";
import type { DashboardSummary } from "./types";

export function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError("");

    getDashboardSummary(token)
      .then((data) => {
        if (isMounted) {
          setSummary(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la información del Dashboard.",
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
  }, [token]);

  return (
    <div className="inventory-view">
      <header className="inventory-header">
        <div>
          <span className="availability-eyebrow">
            PANEL DE CONTROL EJECUTIVO
          </span>
          <h1 className="text-[#17233D]">Dashboard Principal</h1>
          <p className="muted text-[#75819A]">
            Visión consolidada de existencias físicas, alertas de reposición y
            pronóstico semanal de demanda en RESEP S.R.L.
          </p>
        </div>

        <div className="inventory-actions">
          <Link to="/app/movements" className="btn-secondary link-btn">
            ⇄ Registrar movimiento
          </Link>
          <Link
            to="/app/inventory"
            className="btn-primary bg-[#0F52BA] link-btn"
          >
            Gestionar inventario
          </Link>
        </div>
      </header>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {isLoading || !summary ? (
        <LoadingSpinner label="Calculando métricas operativas y proyecciones del Dashboard..." />
      ) : (
        <>
          <KpiGrid
            totalInsumos={summary.total_insumos}
            stockCriticoCount={summary.stock_critico_count}
            alertasActivasCount={summary.alertas_activas_count}
            prediccionSemanalTotal={summary.prediccion_semanal_total}
          />

          <div className="dashboard-main-grid">
            <MainTrendChart
              data={summary.tendencia_semanal}
              weeklyPredictionTotal={summary.prediccion_semanal_total}
            />

            <CategoryDistributionChart
              distribution={summary.distribucion_categorias}
            />
          </div>

          <PriorityInsumosCard items={summary.insumos_prioritarios} />
        </>
      )}
    </div>
  );
}
