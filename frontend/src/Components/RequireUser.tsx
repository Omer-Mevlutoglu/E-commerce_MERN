// Components/RequireUser.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/Auth/AuthContext";

const RequireUser = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    // Not logged in at all → go to login:
    return <Navigate to="/login" replace />;
  }
  if (isAdmin) {
    // Admin is logged in → redirect to admin dashboard:
    return <Navigate to="/admin/orders" replace />;
  }
  // Otherwise (a real “user”): allow user routes to render
  return <Outlet />;
};

export default RequireUser;
