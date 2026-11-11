import { useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { fetchActiveAlerts } from "../../api/client";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { RoleEnum } from "../../types";
import { Sidebar } from "./Sidebar";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRoleLabel(role: string): string {
  if (role === RoleEnum.ADMIN) return "Compras / Admin";
  if (role === RoleEnum.WORKER) return "Almacén";
  if (role === RoleEnum.COMMERCIAL) return "Asesor Comercial";
  return role;
}

export interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { token, user, logout } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);

  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    if (!token || user?.rol === RoleEnum.COMMERCIAL) {
      setAlertCount(0);
      return;
    }

    fetchActiveAlerts(token)
      .then((alerts) => setAlertCount(alerts.length))
      .catch(() => setAlertCount(0));
  }, [token, user?.rol]);

  return (
    <div className="shell">
      <Sidebar alertCount={alertCount} />
      <main className="main-content">
        <header className="navbar">
          <div className="search">
            Buscar en el sistema <kbd>⌘ K</kbd>
          </div>
          <div className="navbar-right">
            <span className="today">Hoy, {formattedDate}</span>
            {user && (
              <button
                type="button"
                className="profile"
                onClick={logout}
                title="Cerrar sesión"
              >
                <span className="avatar">{getInitials(user.nombre)}</span>
                <span>
                  <strong>{user.nombre}</strong>
                  <small>{formatRoleLabel(user.rol)}</small>
                </span>
              </button>
            )}
          </div>
        </header>
        <section className="page-content">{children ?? <Outlet />}</section>
      </main>
    </div>
  );
}
