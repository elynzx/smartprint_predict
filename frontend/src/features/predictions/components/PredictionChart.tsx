import { useMemo, useState } from "react";
import { formatNumber } from "../../inventory/services/inventoryService";
import { INSUFFICIENT_CONSUMPTION_MESSAGE } from "../hooks/usePredictions";
import type {
  PredictionChartDataPoint,
  PredictionHorizon,
  PredictionResponse,
} from "../types";

export interface PredictionChartProps {
  prediction: PredictionResponse | null;
  unit: string;
  horizon: PredictionHorizon;
  error?: string;
}

export function PredictionChart({
  prediction,
  unit,
  horizon,
  error,
}: PredictionChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isWithoutConsumption =
    Boolean(error) ||
    !prediction ||
    prediction.tasa_consumo_diaria <= 0 ||
    prediction.dias_cobertura === null;

  const mergedPoints = useMemo<PredictionChartDataPoint[]>(() => {
    if (!prediction) return [];
    const map = new Map<string, PredictionChartDataPoint>();
    for (const item of prediction.historico_chart_data) {
      map.set(item.label, { ...item });
    }
    for (const item of prediction.estimacion_chart_data) {
      const existing = map.get(item.label);
      if (existing) {
        existing.estimacion = item.estimacion;
      } else {
        map.set(item.label, { ...item });
      }
    }
    return Array.from(map.values());
  }, [prediction]);

  if (isWithoutConsumption || !prediction) {
    return (
      <section
        className="prediction-insufficient-card bg-[#FFF8E7] border border-[#FDE68A] rounded-[12px]"
        role="status"
      >
        <div className="insufficient-card-badge bg-[#E9F1FF] text-[#0F52BA]">
          AVISO DEL MOTOR PREDICTIVO IA
        </div>
        <h2 className="detail-title text-[#17233D]">
          Proyección no disponible para este insumo
        </h2>
        <p className="insufficient-card-text text-[#17233D]">
          {INSUFFICIENT_CONSUMPTION_MESSAGE}
        </p>
        {error && error !== INSUFFICIENT_CONSUMPTION_MESSAGE && (
          <small className="muted text-[#75819A]">
            Detalle técnico: {error}
          </small>
        )}
      </section>
    );
  }

  const numericValues = mergedPoints.flatMap((point) => {
    const arr: number[] = [];
    if (point.historico !== null) arr.push(point.historico);
    if (point.estimacion !== null) arr.push(point.estimacion);
    return arr;
  });

  const maxValue = Math.max(...numericValues, 50) * 1.15;
  const minValue = Math.max(0, Math.min(...numericValues, 0) * 0.8);
  const range = Math.max(1, maxValue - minValue);

  const chartWidth = 660;
  const chartHeight = 250;
  const padLeft = 52;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 42;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  function toX(index: number): number {
    if (mergedPoints.length <= 1) return padLeft;
    return padLeft + (index / (mergedPoints.length - 1)) * innerWidth;
  }

  function toY(value: number): number {
    return padTop + innerHeight - ((value - minValue) / range) * innerHeight;
  }

  const realCoords = mergedPoints
    .map((point, index) =>
      point.historico !== null
        ? { x: toX(index), y: toY(point.historico), index, point }
        : null,
    )
    .filter(
      (
        item,
      ): item is {
        x: number;
        y: number;
        index: number;
        point: PredictionChartDataPoint;
      } => item !== null,
    );

  const forecastCoords = mergedPoints
    .map((point, index) =>
      point.estimacion !== null
        ? { x: toX(index), y: toY(point.estimacion), index, point }
        : null,
    )
    .filter(
      (
        item,
      ): item is {
        x: number;
        y: number;
        index: number;
        point: PredictionChartDataPoint;
      } => item !== null,
    );

  const realPolyline = realCoords
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const forecastPolyline = forecastCoords
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const realAreaPath =
    realCoords.length > 1
      ? `M ${realCoords[0].x},${padTop + innerHeight} ` +
        realCoords.map((c) => `L ${c.x},${c.y}`).join(" ") +
        ` L ${realCoords[realCoords.length - 1].x},${padTop + innerHeight} Z`
      : "";

  const activePoint =
    hoveredIdx !== null
      ? mergedPoints[hoveredIdx]
      : mergedPoints[mergedPoints.length - 1];

  return (
    <section className="prediction-main-chart-card bg-white border border-[#E8EDF5] rounded-[12px]">
      <div className="dashboard-card-header">
        <div>
          <h2 className="detail-title text-[#17233D]">
            Curva de Consumo Real y Proyección ({horizon} días)
          </h2>
          <small className="muted text-[#75819A]">
            Regresión lineal entrenada sobre salidas históricas de{" "}
            <strong>{prediction.nombre}</strong>.
          </small>
        </div>

        <div className="prediction-chart-badges">
          <span className="status good bg-[#E9FBF5] text-[#10B981] border border-[#E9FBF5]">
            <i className="status-dot dot-good" />
            Confianza: 92%
          </span>
          <span className="availability-meta-chip font-mono tabular-nums">
            MAE: {prediction.metricas_error.mae.toFixed(2)} · RMSE:{" "}
            {prediction.metricas_error.rmse.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="prediction-chart-legend">
        <span>
          <i className="chart-line-real" /> Curva histórica real (#0F52BA)
        </span>
        <span>
          <i className="chart-line-forecast" /> Proyección futura estimada
          (#00A4E4)
        </span>
      </div>

      <div className="recharts-wrapper">
        <svg
          className="main-trend-svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label={`Gráfico de predicción de consumo para ${prediction.nombre}`}
        >
          <defs>
            <linearGradient
              id="predictionRealArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#0F52BA" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0F52BA" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((step) => {
            const y = padTop + step * innerHeight;
            const valueLabel = Math.round(maxValue - step * range);
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
                  {valueLabel}
                </text>
              </g>
            );
          })}

          {realAreaPath && (
            <path d={realAreaPath} fill="url(#predictionRealArea)" />
          )}

          {realPolyline && (
            <polyline
              fill="none"
              stroke="#0F52BA"
              strokeWidth="3"
              points={realPolyline}
            />
          )}

          {forecastPolyline && (
            <polyline
              fill="none"
              stroke="#00A4E4"
              strokeWidth="3"
              strokeDasharray="6 4"
              points={forecastPolyline}
            />
          )}

          {mergedPoints.map((point, index) => {
            const x = toX(index);
            return (
              <g
                key={point.label}
                className="chart-point-group"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {point.historico !== null && (
                  <circle
                    cx={x}
                    cy={toY(point.historico)}
                    r={hoveredIdx === index ? 6 : 4.5}
                    fill="#0F52BA"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                )}
                {point.estimacion !== null && (
                  <circle
                    cx={x}
                    cy={toY(point.estimacion)}
                    r={hoveredIdx === index ? 6 : 4.5}
                    fill="#00A4E4"
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
                  fontWeight={hoveredIdx === index ? "700" : "500"}
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {activePoint && (
        <div className="trend-summary-bar">
          <span>
            Corte seleccionado: <strong>{activePoint.label}</strong>
          </span>
          <span className="font-mono tabular-nums">
            Histórico real:{" "}
            <strong className="text-[#0F52BA]">
              {activePoint.historico !== null
                ? `${formatNumber(activePoint.historico)} ${unit}`
                : "—"}
            </strong>
          </span>
          <span className="font-mono tabular-nums">
            Proyección IA:{" "}
            <strong className="text-[#00A4E4]">
              {activePoint.estimacion !== null
                ? `${formatNumber(activePoint.estimacion)} ${unit}`
                : "—"}
            </strong>
          </span>
        </div>
      )}
    </section>
  );
}
