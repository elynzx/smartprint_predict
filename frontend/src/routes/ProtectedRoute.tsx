import { Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useAuth } from "../features/auth/hooks/useAuth";
import { RoleEnum, type UserRole } from "../types";

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner label="Verificando sesión..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    const fallbackPath =
      user.rol === RoleEnum.COMMERCIAL ? "/disponibilidad" : "/app/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
