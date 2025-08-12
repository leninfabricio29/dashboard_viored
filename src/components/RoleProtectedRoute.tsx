import { Navigate } from "react-router-dom";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
  children: JSX.Element;
}

const getUserRole = (): string | null => {
  return localStorage.getItem("role");
};

const RoleProtectedRoute = ({ allowedRoles, children }: RoleProtectedRouteProps) => {
  const userRole = getUserRole();
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default RoleProtectedRoute;
