import { useState } from "react";
import { RoleEnum } from "../../types";
import { useAuth } from "../auth/hooks/useAuth";
import { InsumoFormModal } from "./components/InsumoFormModal";
import { InventoryTable } from "./components/InventoryTable";
import { MovementModal } from "./components/MovementModal";
import { useInsumos } from "./hooks/useInsumos";
import type { MovementType, SupplyItem } from "./types";

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === RoleEnum.ADMIN;
  const {
    supplies,
    filteredSupplies,
    selectedSupply,
    categories,
    searchQuery,
    categoryFilter,
    isLoading,
    error,
    toastMessage,
    setSelectedSupply,
    setSearchQuery,
    setCategoryFilter,
    reloadSupplies,
    handleExportCsv,
    notifyToast,
  } = useInsumos();

  const [formModalMode, setFormModalMode] = useState<"create" | "edit" | null>(
    null,
  );
  const [isMovementModalOpen, setIsMovementModalOpen] =
    useState<boolean>(false);

  async function handleSupplySaved(saved: SupplyItem, mode: "create" | "edit") {
    await reloadSupplies(saved.id);
    notifyToast(
      mode === "create"
        ? `Insumo "${saved.nombre}" registrado exitosamente.`
        : `Insumo "${saved.nombre}" actualizado correctamente.`,
    );
  }

  async function handleMovementCreated(type: MovementType, supplyName: string) {
    await reloadSupplies(selectedSupply?.id);
    notifyToast(
      `${type === "ENTRADA" ? "Entrada" : "Salida"} de "${supplyName}" registrada en Kardex.`,
    );
  }

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
          <span className="availability-eyebrow">CATÁLOGO DE PLANTA</span>
          <h1 className="text-[#17233D]">Gestión de Inventario</h1>
          <p className="muted text-[#75819A]">
            Control físico de materiales de impresión, umbrales mínimos de
            reposición y costos unitarios.
          </p>
        </div>
        <div className="inventory-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void handleExportCsv()}
          >
            <span aria-hidden="true">↓</span> Exportar
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn-primary bg-[#0F52BA]"
              onClick={() => setFormModalMode("create")}
            >
              <span aria-hidden="true">+</span> Nuevo insumo
            </button>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <InventoryTable
        supplies={filteredSupplies}
        selectedSupply={selectedSupply}
        categories={categories}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        isLoading={isLoading}
        canEdit={isAdmin}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategoryFilter}
        onSelectSupply={setSelectedSupply}
        onOpenEdit={(supply) => {
          setSelectedSupply(supply);
          setFormModalMode("edit");
        }}
        onOpenMovement={(supply) => {
          setSelectedSupply(supply);
          setIsMovementModalOpen(true);
        }}
      />

      <InsumoFormModal
        isOpen={formModalMode !== null}
        mode={formModalMode ?? "create"}
        supply={selectedSupply}
        onClose={() => setFormModalMode(null)}
        onSaved={handleSupplySaved}
      />

      <MovementModal
        isOpen={isMovementModalOpen}
        supply={selectedSupply}
        supplies={supplies}
        onSelectSupply={setSelectedSupply}
        onClose={() => setIsMovementModalOpen(false)}
        onMovementCreated={handleMovementCreated}
      />
    </div>
  );
}
