import { useState } from "react";
import { formatNumber } from "../../inventory/services/inventoryService";
import { buildEightWeekTrend } from "../services/dashboardService";
import type { WeeklyTrendPoint } from "../types";

export interface MainTrendChartProps {
  data?: WeeklyTrendPoint[];
  weeklyPredictionTotal: number;
}

export function MainTrendChart({
  data,
  weeklyPredictionTotal,
}: MainTrendChartProps) {
  const points =
    data && data.length > 0
      ? data
      : buildEightWeekTrend(weeklyPredictionTotal);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const allValues = points.flatMap((point) =>
    point.realConsumption !== null
      ? [point.realConsumption, point.projectedConsumption]
      : [point.projectedConsumption],
  );
  const maxValue = Math.max(...allValues, 100) * 1.12;
  const minValue = Math.max(0, Math.min(...allValues) * 0.78);
  const range = Math.max(1, maxValue - minValue);

  const chartWidth = 640;
  const chartHeight = 230;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 38;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  function toX(index: number): number {
    if (points.length <= 1) return padLeft;
    return padLeft + (index / (points.length - 1)) * innerWidth;
  }

  function toY(value: number): number {
    return padTop + innerHeight - ((value - minValue) / range) * innerHeight;
  }

  const realCoordinates = points
    .map((point, index) =>
      point.realConsumption !== null
        ? { x: toX(index), y: toY(point.realConsumption), index, point }
        : null,
    )
    .filter(
      (
        entry,
      ): entry is {
        x: number;
        y: number;
        index: number;
        point: WeeklyTrendPoint;
      } => entry !== null,
    );

  const projectedCoordinates = points.map((point, index) => ({
    x: toX(index),
    y: toY(point.projectedConsumption),
    index,
    point,
  }));

  const realPolyline = realCoordinates
    .map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
    .join(" ");

  const projectedPolyline = projectedCoordinates
    .map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    realCoordinates.length > 1
      ? `M ${realCoordinates[0].x},${padTop + innerHeight} ` +
        realCoordinates.map((c) => `L ${c.x},${c.y}`).join(" ") +
        ` L ${realCoordinates[realCoordinates.length - 1].x},${padTop + innerHeight} Z`
      : "";

  const activePoint =
    hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <section className="dashboard-chart-card bg-white border border-[#E8EDF5] rounded-[12px]">
      <div className="dashboard-card-header">
        <div>
          <h2 className="detail-title text-[#17233D]">
            Tendencia de Consumo y Proyección General (8 Semanas)
          </h2>
          <small className="muted text-[#75819A]">
            Cruce de consumo histórico de taller frente a la estimación lineal
            de demanda IA.
          </small>
        </div>

        <div className="prediction-chart-legend">
          <span>
            <i className="chart-line-real" /> Consumo Real (#0F52BA)
          </span>
          <span>
            <i className="chart-line-forecast" /> Proyección IA (#00A4E4)
          </span>
        </div>
      </div>

      <div className="recharts-wrapper">
        <svg
          className="main-trend-svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label="Gráfico de tendencia de consumo y proyección a 8 semanas"
        >
          <defs>
            <linearGradient id="realAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F52BA" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0F52BA" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((step) => {
            const y = padTop + step * innerHeight;
            const labelValue = Math.round(maxValue - step * range);
            return (
              <g key={step}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#E8EDF5"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#75819A"
                  fontSize="11"
                >
                  {labelValue}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#realAreaGradient)" />}

          <polyline
            fill="none"
            stroke="#00A4E4"
            strokeWidth="2.8"
            strokeDasharray="6 4"
            points={projectedPolyline}
          />

          {realPolyline && (
            <polyline
              fill="none"
              stroke="#0F52BA"
              strokeWidth="3"
              points={realPolyline}
            />
          )}

          {projectedCoordinates.map(({ x, y, index, point }) => (
            <g
              key={point.week}
              className="chart-point-group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={x}
                cy={y}
                r={hoveredIndex === index ? 6 : 4}
                fill="#00A4E4"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {point.realConsumption !== null && (
                <circle
                  cx={x}
                  cy={toY(point.realConsumption)}
                  r={hoveredIndex === index ? 6 : 4.5}
                  fill="#0F52BA"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
              <text
                x={x}
                y={chartHeight - 12}
                textAnchor="middle"
                fill="#75819A"
                fontSize="11.5"
                fontWeight={hoveredIndex === index ? "700" : "500"}
              >
                {point.week}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {activePoint && (
        <div className="trend-summary-bar">
          <span>
            Período seleccionado: <strong>{activePoint.week}</strong>
          </span>
          <span className="font-mono tabular-nums">
            Consumo real:{" "}
            <strong className="text-[#0F52BA]">
              {activePoint.realConsumption !== null
                ? `${formatNumber(activePoint.realConsumption)} und.`
                : "Proyectado"}
            </strong>
          </span>
          <span className="font-mono tabular-nums">
            Estimación IA:{" "}
            <strong className="text-[#00A4E4]">
              {formatNumber(activePoint.projectedConsumption)} und.
            </strong>
          </span>
        </div>
      )}
    </section>
  );
}
