import { Navigate } from "react-router-dom";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
  children: JSX.Element;
}

const getUserRole = (): string | null => {
  return localStorage.getItem("role");
};

const RoleProtectedRoute = ({ children }: RoleProtectedRouteProps) => {
  const userRole = getUserRole();

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Los colaboradores usan roles configurables por entidad. El rol base "user"
  // sigue fuera del panel administrativo, mientras que los demás entran y el
  // menú se limita con los permisos devueltos en el inicio de sesión.
  if (userRole === "user") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
