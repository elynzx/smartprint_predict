import { useEffect, useState } from "react";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAuth } from "../auth/hooks/useAuth";
import {
  exportInventoryCsv,
  fetchSupplies,
  formatCurrency,
  formatNumber,
  formatSupplyCode,
  getSupplyStatus,
} from "../inventory/services/inventoryService";
import type { SupplyItem } from "../inventory/types";

export function ReportsPage() {
  const { token } = useAuth();
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError("");

    fetchSupplies(token)
      .then((data) => {
        if (isMounted) {
          setSupplies(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo generar la vista de reportes.",
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

  async function handleDownloadCsv() {
    if (!token) return;
    await exportInventoryCsv(token, supplies);
    setToastMessage("Reporte CSV descargado exitosamente.");
    window.setTimeout(() => setToastMessage(""), 3500);
  }

  const totalValuation = supplies.reduce(
    (sum, item) => sum + item.stock_actual * item.costo_unitario,
    0,
  );

  return (
    <div className="inventory-view">
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <span className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="inventory-header">
        <div>
          <span className="availability-eyebrow">AUDITORÍA Y EXPORTACIÓN</span>
          <h1 className="text-[#17233D]">Reportes de Inventario</h1>
          <p className="muted text-[#75819A]">
            Consolidado valorizado de existencias físicas en almacén y descarga
            en formato CSV para contabilidad y compras.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary bg-[#0F52BA]"
          onClick={() => void handleDownloadCsv()}
        >
          <span aria-hidden="true">↓</span> Descargar inventario.csv
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      {isLoading ? (
        <LoadingSpinner label="Consolidando reporte valorizado..." />
      ) : (
        <section className="inventory-table-panel bg-white border border-[#E8EDF5] rounded-[12px]">
          <div className="kardex-history-header">
            <div>
              <h2 className="detail-title text-[#17233D]">
                Valorización de Existencias por Insumo
              </h2>
              <small className="muted">
                Valor total actual en planta:{" "}
                <strong className="font-mono tabular-nums text-[#0F52BA]">
                  {formatCurrency(totalValuation)}
                </strong>
              </small>
            </div>
          </div>

          <div className="table-scroll">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Insumo</th>
                  <th>Categoría</th>
                  <th className="num-col">Stock Actual</th>
                  <th className="num-col">Costo Unitario</th>
                  <th className="num-col">Valor Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((supply) => {
                  const status = getSupplyStatus(
                    supply.stock_actual,
                    supply.stock_minimo,
                  );
                  const lineTotal = supply.stock_actual * supply.costo_unitario;

                  return (
                    <tr key={supply.id} className="inventory-row">
                      <td className="font-mono tabular-nums code-cell">
                        {formatSupplyCode(supply.id)}
                      </td>
                      <td>
                        <strong className="insumo-row-name">
                          {supply.nombre}
                        </strong>
                      </td>
                      <td className="text-[#75819A]">{supply.categoria}</td>
                      <td className="num-col font-mono tabular-nums">
                        {formatNumber(supply.stock_actual)}{" "}
                        <span className="unit-label">{supply.unidad}</span>
                      </td>
                      <td className="num-col font-mono tabular-nums">
                        {formatCurrency(supply.costo_unitario)}
                      </td>
                      <td className="num-col font-mono tabular-nums">
                        <strong>{formatCurrency(lineTotal)}</strong>
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
