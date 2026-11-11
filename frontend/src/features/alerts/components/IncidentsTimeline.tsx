import type { IncidentTimelineItem } from "../types";

export interface IncidentsTimelineProps {
  incidents: IncidentTimelineItem[];
}

export function IncidentsTimeline({ incidents }: IncidentsTimelineProps) {
  return (
    <aside
      className="alerts-timeline-card bg-white border border-[#E8EDF5] rounded-[12px]"
      aria-label="Historial reciente de incidencias"
    >
      <div className="ai-card-header">
        <div>
          <span className="availability-eyebrow">BITÁCORA DE PLANTA</span>
          <h2 className="detail-title text-[#17233D]">
            Historial de Incidencias
          </h2>
        </div>
      </div>

      <ul className="incidents-timeline-list">
        {incidents.map((incident) => {
          const dotClass =
            incident.severity === "critico"
              ? "status-dot dot-critical"
              : incident.severity === "revision"
                ? "status-dot dot-warning"
                : "status-dot dot-good";

          return (
            <li key={incident.id} className="incident-timeline-entry">
              <div className="incident-timeline-marker">
                <i className={dotClass} />
                <span className="incident-timeline-line" />
              </div>

              <div className="incident-timeline-body">
                <div className="incident-timeline-meta">
                  <span className="font-mono tabular-nums text-[#75819A]">
                    {incident.timeLabel}
                  </span>
                  {incident.supplyCode && (
                    <span className="detail-code font-mono tabular-nums">
                      {incident.supplyCode}
                    </span>
                  )}
                </div>
                <strong className="text-[#17233D]">{incident.title}</strong>
                <p className="muted text-[#75819A]">{incident.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
