import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = () => {
  const { isAuthenticated, permissions, isSuperAdmin } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAllowed =
    isSuperAdmin ||
    currentPath === "/" ||
    currentPath === "/settings" ||
    permissions.includes(currentPath);

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
