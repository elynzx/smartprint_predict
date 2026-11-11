import { useEffect, useState, type ReactNode } from "react";
import { getAlerts } from "../api";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!token || user?.rol === "asesor_comercial") return;
    getAlerts(token)
      .then((alerts) => setAlertCount(alerts.length))
      .catch(() => setAlertCount(0));
  }, [token, user?.rol]);

  return (
    <div className="shell">
      <Sidebar alertCount={alertCount} />
      <main className="main-content">
        <Navbar />
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}
