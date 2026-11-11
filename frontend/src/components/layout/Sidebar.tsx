import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { RoleEnum } from "../../types";

export interface SidebarProps {
  alertCount: number;
}

interface NavigationItem {
  label: string;
  path: string;
  adminOnly?: boolean;
  showAlertBadge?: boolean;
}

const OPERATIONAL_LINKS: NavigationItem[] = [
  { label: "Inicio", path: "/app/dashboard" },
  { label: "Inventario", path: "/app/inventory" },
  { label: "Movimientos", path: "/app/movements" },
  { label: "Alertas", path: "/app/alerts", showAlertBadge: true },
  { label: "Predicción", path: "/app/predictions", adminOnly: true },
  { label: "Reportes", path: "/app/reports" },
  { label: "Disponibilidad", path: "/disponibilidad", adminOnly: true },
];

const COMMERCIAL_LINKS: NavigationItem[] = [
  { label: "Factibilidad Comercial", path: "/disponibilidad" },
];

function resolveNavLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? "menu-link active bg-[#E9F1FF] text-[#0F52BA] font-bold"
    : "menu-link text-[#75819A]";
}

export function Sidebar({ alertCount }: SidebarProps) {
  const { user } = useAuth();
  const isCommercial = user?.rol === RoleEnum.COMMERCIAL;
  const isAdmin = user?.rol === RoleEnum.ADMIN;

  const visibleLinks = isCommercial
    ? COMMERCIAL_LINKS
    : OPERATIONAL_LINKS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="sidebar w-[244px] bg-white border-r border-[#E8EDF5]">
      <div className="brand">
        <span className="brand-mark">R</span>
        <span>
          <strong>RESEP</strong>
          <small>
            SmartPrint <b>Predict</b>
          </small>
        </span>
      </div>

      <nav className="menu" aria-label="Navegación principal">
        {visibleLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={resolveNavLinkClass}
          >
            <span>{item.label}</span>
            {item.showAlertBadge && (
              <span className="alert-badge">{alertCount}</span>
            )}
            {item.label === "Reportes" && <span className="menu-icon">›</span>}
          </NavLink>
        ))}
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
