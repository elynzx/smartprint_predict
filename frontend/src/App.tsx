import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { useAuth } from "./context/AuthContext";
import { Disponibilidad } from "./pages/Disponibilidad";
import { Login } from "./pages/Login";
import { Placeholder } from "./pages/Placeholder";

function Protected({ operational = false }: { operational?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (operational && user.rol === "asesor_comercial")
    return <Navigate to="/disponibilidad" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route path="/disponibilidad" element={<Disponibilidad />} />
      </Route>
      <Route element={<Protected operational />}>
        <Route path="/app" element={<Placeholder title="Inicio" />} />
        <Route
          path="/app/inventario"
          element={<Placeholder title="Inventario" />}
        />
        <Route
          path="/app/movimientos"
          element={<Placeholder title="Movimientos" />}
        />
        <Route
          path="/app/prediccion"
          element={<Placeholder title="Predicción IA" />}
        />
        <Route
          path="/app/reportes"
          element={<Placeholder title="Reportes" />}
        />
        <Route path="/app/alertas" element={<Placeholder title="Alertas" />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
