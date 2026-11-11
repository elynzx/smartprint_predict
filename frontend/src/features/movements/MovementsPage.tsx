import { Link } from "react-router-dom";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { formatNumber } from "../inventory/services/inventoryService";
import { MovementForm } from "./components/MovementForm";
import { MovementPreviewCard } from "./components/MovementPreviewCard";
import { useKardexMovement } from "./hooks/useKardexMovement";

function formatOperationDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MovementsPage() {
  const {
    supplies,
    movements,
    selectedSupply,
    movementType,
    quantityInput,
    parsedQuantity,
    isPositiveQuantity,
    reason,
    referenceDocument,
    supplier,
    observations,
    estimatedStock,
    isInvalidSalida,
    isSubmitDisabled,
    isLoadingSupplies,
    isSubmitting,
    errorMessage,
    toastMessage,
    warningMessage,
    setMovementType,
    setQuantityInput,
    setReason,
    setReferenceDocument,
    setSupplier,
    setObservations,
    handleSelectSupply,
    handleSubmitMovement,
    resetFormFields,
  } = useKardexMovement();

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
          <span className="availability-eyebrow">CONTROL DE KARDEX</span>
          <h1 className="text-[#17233D]">Registro de Movimientos</h1>
          <p className="muted text-[#75819A]">
            Ingreso de compras y despacho de materiales a prensa con validación
            antinegativa en tiempo real.
          </p>
        </div>

        <Link to="/app/inventory" className="btn-secondary link-btn">
          ← Volver a Inventario
        </Link>
      </header>

      {isLoadingSupplies ? (
        <LoadingSpinner label="Cargando catálogo de insumos y Kardex..." />
      ) : (
        <>
          <div className="movements-two-col-layout">
            <MovementForm
              supplies={supplies}
              selectedSupply={selectedSupply}
              movementType={movementType}
              quantityInput={quantityInput}
              reason={reason}
              referenceDocument={referenceDocument}
              supplier={supplier}
              observations={observations}
              isInvalidSalida={isInvalidSalida}
              isSubmitDisabled={isSubmitDisabled}
              isSubmitting={isSubmitting}
              warningMessage={warningMessage}
              errorMessage={errorMessage}
              onMovementTypeChange={setMovementType}
              onSelectSupply={handleSelectSupply}
              onQuantityChange={setQuantityInput}
              onReasonChange={setReason}
              onReferenceDocumentChange={setReferenceDocument}
              onSupplierChange={setSupplier}
              onObservationsChange={setObservations}
              onSubmit={handleSubmitMovement}
              onReset={resetFormFields}
            />

            <MovementPreviewCard
              supply={selectedSupply}
              movementType={movementType}
              quantity={parsedQuantity}
              isPositiveQuantity={isPositiveQuantity}
              estimatedStock={estimatedStock}
              isInvalidSalida={isInvalidSalida}
            />
          </div>

          <section className="inventory-table-panel bg-white border border-[#E8EDF5] rounded-[12px]">
            <div className="kardex-history-header">
              <div>
                <h2 className="detail-title text-[#17233D]">
                  Últimos Movimientos Registrados
                </h2>
                <small className="muted text-[#75819A]">
                  Trazabilidad auditada de entradas y salidas en planta.
                </small>
              </div>
            </div>

            {movements.length === 0 ? (
              <div className="availability-empty">
                No existen movimientos registrados aún.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Insumo</th>
                      <th className="num-col">Cantidad</th>
                      <th>Referencia / Motivo</th>
                      <th>Operador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.slice(0, 15).map((record) => {
                      const isEntry = record.tipo === "ENTRADA";
                      return (
                        <tr key={record.id} className="inventory-row">
                          <td className="font-mono tabular-nums text-[#75819A]">
                            {formatOperationDate(record.fecha_operacion)}
                          </td>
                          <td>
                            <span
                              className={
                                isEntry
                                  ? "status good bg-[#E9FBF5] text-[#10B981]"
                                  : "status warning bg-[#FFF8E7] text-[#F59E0B]"
                              }
                            >
                              <i
                                className={
                                  isEntry
                                    ? "status-dot dot-good"
                                    : "status-dot dot-warning"
                                }
                              />
                              {record.tipo}
                            </span>
                          </td>
                          <td>
                            <strong className="insumo-row-name text-[#17233D]">
                              {record.insumo_nombre}
                            </strong>
                          </td>
                          <td
                            className={
                              isEntry
                                ? "num-col font-mono tabular-nums text-[#10B981]"
                                : "num-col font-mono tabular-nums text-[#EF4444]"
                            }
                          >
                            <strong>
                              {isEntry ? "+" : "-"}
                              {formatNumber(record.cantidad)}
                            </strong>{" "}
                            <span className="unit-label">{record.unidad}</span>
                          </td>
                          <td>
                            {record.documento_referencia && (
                              <span className="detail-code font-mono tabular-nums">
                                {record.documento_referencia}
                              </span>
                            )}{" "}
                            <span>{record.motivo}</span>
                          </td>
                          <td className="text-[#75819A]">
                            {record.usuario_nombre}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
