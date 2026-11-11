import { DEFAULT_CATEGORY_DISTRIBUTION } from "../services/dashboardService";
import type { CategoryDistributionItem } from "../types";

export interface CategoryDistributionChartProps {
  distribution?: CategoryDistributionItem[];
}

export function CategoryDistributionChart({
  distribution,
}: CategoryDistributionChartProps) {
  const items =
    distribution && distribution.length > 0
      ? distribution
      : DEFAULT_CATEGORY_DISTRIBUTION;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercentage = 0;

  return (
    <section className="dashboard-donut-card bg-white border border-[#E8EDF5] rounded-[12px]">
      <div className="dashboard-card-header">
        <div>
          <h2 className="detail-title text-[#17233D]">
            Distribución por Categoría
          </h2>
          <small className="muted text-[#75819A]">
            Participación porcentual de materiales críticos en planta.
          </small>
        </div>
      </div>

      <div className="donut-layout">
        <div className="donut-svg-container">
          <svg
            width="168"
            height="168"
            viewBox="0 0 168 168"
            role="img"
            aria-label="Gráfico Donut de distribución por categoría: Papel 38%, Tintas 24%, Planchas 18%, Otros 20%"
          >
            <circle
              cx="84"
              cy="84"
              r={radius}
              fill="transparent"
              stroke="#F4F7FE"
              strokeWidth="22"
            />
            {items.map((segment) => {
              const strokeDasharray = `${(segment.porcentaje / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -(
                (cumulativePercentage / 100) *
                circumference
              );
              cumulativePercentage += segment.porcentaje;

              return (
                <circle
                  key={segment.categoria}
                  cx="84"
                  cy="84"
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="22"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 84 84)"
                />
              );
            })}
            <text
              x="84"
              y="80"
              textAnchor="middle"
              fill="#17233D"
              fontSize="19"
              fontWeight="800"
            >
              100%
            </text>
            <text
              x="84"
              y="98"
              textAnchor="middle"
              fill="#75819A"
              fontSize="11"
            >
              Catálogo
            </text>
          </svg>
        </div>

        <ul className="donut-legend-list">
          {items.map((item) => (
            <li key={item.categoria} className="donut-legend-item">
              <span className="donut-legend-label">
                <i
                  className="donut-color-swatch"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.categoria}</span>
              </span>
              <strong className="font-mono tabular-nums text-[#17233D]">
                {item.porcentaje}%
              </strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
