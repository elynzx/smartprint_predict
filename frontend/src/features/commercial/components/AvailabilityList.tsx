import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatUnitLabel,
  resolveCategoryLabel,
  resolveCommercialNote,
} from "../services/commercialService";
import type { CommercialSupplyItem } from "../types";

export interface AvailabilityListProps {
  items: CommercialSupplyItem[];
  isLoading: boolean;
  searchTerm: string;
}

export function AvailabilityList({
  items,
  isLoading,
  searchTerm,
}: AvailabilityListProps) {
  if (isLoading) {
    return (
      <LoadingSpinner label="Consultando disponibilidad de insumos en planta..." />
    );
  }

  if (items.length === 0) {
    return (
      <div className="availability-empty">
        No se encontraron insumos que coincidan con{" "}
        <strong>"{searchTerm}"</strong>.
      </div>
    );
  }

  return (
    <div className="availability-grid">
      {items.map((item) => {
        const isAvailable = item.estado_disponibilidad === "Disponible";
        const category = resolveCategoryLabel(item.nombre, item.categoria);
        const formattedUnit = formatUnitLabel(item.unidad);
        const commercialNote = resolveCommercialNote(item);

        return (
          <article
            key={item.insumo_id}
            className="availability-card bg-white border border-[#E8EDF5] rounded-[12px]"
          >
            <div className="availability-card-top">
              <span className="availability-meta-chip">
                {category} / {formattedUnit}
              </span>
              <StatusBadge status={item.estado_disponibilidad} />
            </div>

            <h2 className="availability-title text-[#17233D]">{item.nombre}</h2>

            <dl className="availability-specs">
              <div>
                <dt>Categoría</dt>
                <dd>{category}</dd>
              </div>
              <div>
                <dt>Unidad de medida</dt>
                <dd>{formattedUnit}</dd>
              </div>
            </dl>

            <div
              className={
                isAvailable
                  ? "availability-note note-good"
                  : "availability-note note-warning"
              }
            >
              <span className="availability-note-label">
                Orientación comercial
              </span>
              <p>{commercialNote}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
