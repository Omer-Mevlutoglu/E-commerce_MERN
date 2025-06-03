// Components/HomeGuard.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/Auth/AuthContext";
import HomePage from "../pages/HomePage";

const HomeGuard = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  // If an admin is already logged in, send them to the admin dashboard:
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin/orders" replace />;
  }

  // Otherwise, show the public HomePage:
  return <HomePage />;
};

export default HomeGuard;
