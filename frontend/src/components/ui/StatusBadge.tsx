import type { StatusVariant } from "../../types";

export interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

const STATUS_STYLE_MAP: Record<
  StatusVariant,
  { badgeClass: string; dotClass: string }
> = {
  Crítico: {
    badgeClass:
      "status critical bg-[#FFF0F0] text-[#EF4444] border border-[#FFF0F0]",
    dotClass: "status-dot dot-critical",
  },
  Alta: {
    badgeClass:
      "status critical bg-[#FFF0F0] text-[#EF4444] border border-[#FFF0F0]",
    dotClass: "status-dot dot-critical",
  },
  "En Riesgo": {
    badgeClass:
      "status warning bg-[#FFF8E7] text-[#F59E0B] border border-[#FFF8E7]",
    dotClass: "status-dot dot-warning",
  },
  "Stock Limitado": {
    badgeClass:
      "status warning bg-[#FFF8E7] text-[#F59E0B] border border-[#FFF8E7]",
    dotClass: "status-dot dot-warning",
  },
  Media: {
    badgeClass:
      "status warning bg-[#FFF8E7] text-[#F59E0B] border border-[#FFF8E7]",
    dotClass: "status-dot dot-warning",
  },
  Estable: {
    badgeClass:
      "status good bg-[#E9FBF5] text-[#10B981] border border-[#E9FBF5]",
    dotClass: "status-dot dot-good",
  },
  Disponible: {
    badgeClass:
      "status good bg-[#E9FBF5] text-[#10B981] border border-[#E9FBF5]",
    dotClass: "status-dot dot-good",
  },
  Baja: {
    badgeClass:
      "status good bg-[#E9FBF5] text-[#10B981] border border-[#E9FBF5]",
    dotClass: "status-dot dot-good",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const styles = STATUS_STYLE_MAP[status] ?? STATUS_STYLE_MAP.Estable;
  return (
    <span className={`${styles.badgeClass} ${className}`.trim()}>
      <i className={styles.dotClass} />
      {status}
    </span>
  );
}
