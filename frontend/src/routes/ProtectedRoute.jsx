import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import Loader from "../components/Loader";

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <Loader message="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/tickets" replace />;
  }

  return <Outlet />;
}
