import { useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { fetchActiveAlerts } from "../../api/client";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { RoleEnum } from "../../types";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { token, user } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);

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
        <Navbar />
        <section className="page-content">{children ?? <Outlet />}</section>
      </main>
    </div>
  );
}
