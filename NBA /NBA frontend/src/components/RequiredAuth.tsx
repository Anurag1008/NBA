// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

type RequireAuthProps = {
  allowedRoles: string[];
};

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles }) => {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth?.accessToken) {
    // Not logged in → redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (auth.roles?.some((role) => allowedRoles.includes(role))) {
    // Authorized → render the child routes
    return <Outlet />;
  }

  // Logged in but role not allowed → unauthorized
  return <Navigate to="/unauthorized" replace />;
};

export default RequireAuth;
