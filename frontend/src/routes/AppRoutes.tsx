import { Navigate, Route, Routes } from "react-router-dom";
import { AlertsPage } from "../features/alerts/AlertsPage";
import { LoginForm } from "../features/auth/components/LoginForm";
import { CommercialPage } from "../features/commercial/CommercialPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { MovementsPage } from "../features/movements/MovementsPage";
import { PredictionsPage } from "../features/predictions/PredictionsPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { RoleEnum } from "../types";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[RoleEnum.COMMERCIAL, RoleEnum.ADMIN]}
          />
        }
      >
        <Route path="/disponibilidad" element={<CommercialPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={[RoleEnum.ADMIN, RoleEnum.WORKER]} />
        }
      >
        <Route
          path="/app"
          element={<Navigate to="/app/dashboard" replace />}
        />
        <Route path="/app/dashboard" element={<DashboardPage />} />
        <Route path="/app/inventory" element={<InventoryPage />} />
        <Route path="/app/inventario" element={<InventoryPage />} />
        <Route path="/inventario" element={<InventoryPage />} />
        <Route path="/app/movements" element={<MovementsPage />} />
        <Route path="/app/movimientos" element={<MovementsPage />} />
        <Route path="/movimientos" element={<MovementsPage />} />
        <Route path="/app/alerts" element={<AlertsPage />} />
        <Route path="/app/alertas" element={<AlertsPage />} />
        <Route path="/app/reports" element={<ReportsPage />} />
        <Route path="/app/reportes" element={<ReportsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[RoleEnum.ADMIN]} />}>
        <Route path="/app/predictions" element={<PredictionsPage />} />
        <Route path="/app/prediccion" element={<PredictionsPage />} />
        <Route path="/prediccion" element={<PredictionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
