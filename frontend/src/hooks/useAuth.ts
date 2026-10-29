import { useSelector } from "react-redux";

export const useAuth = () => {
  const { user, token } = useSelector((state: any) => state.auth);

  return {
    user,
    token,
    role: user?.role || "",
    permissions: user?.permissions || [],
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isAdmin: user?.role === "ADMIN",
    isAuthenticated: !!token && !!user,
  };
};
