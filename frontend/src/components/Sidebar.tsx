import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  alertCount: number;
}

const operationalLinks = [
  ["Inicio", "/app"],
  ["Inventario", "/app/inventario"],
  ["Movimientos", "/app/movimientos"],
  ["Predicción", "/app/prediccion"],
  ["Reportes", "/app/reportes"],
  ["Disponibilidad", "/disponibilidad"],
];

const commercialLinks = [["Factibilidad Comercial", "/disponibilidad"]];

export function Sidebar({ alertCount }: SidebarProps) {
  const { user } = useAuth();
  const isComercial = user?.rol === "asesor_comercial";
  const visibleLinks = isComercial ? commercialLinks : operationalLinks;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">R</span>
        <span>
          <strong>RESEP</strong>
          <small>
            SmartPrint <b>Predict</b>
          </small>
        </span>
      </div>
      <nav className="menu">
        {visibleLinks.map(([label, path]) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/app"}
            className="menu-link"
          >
            <span>{label}</span>
            {label === "Reportes" && <span className="menu-icon">›</span>}
          </NavLink>
        ))}
        {!isComercial && (
          <NavLink to="/app/alertas" className="menu-link">
            <span>Alertas</span>
            <span className="alert-badge">{alertCount}</span>
          </NavLink>
        )}
      </nav>
      <div className="sidebar-bottom">
        <span>Configuración</span>
        <div className="ai-status">
          <i /> Predicción IA activa
        </div>
      </div>
    </aside>
  );
}
