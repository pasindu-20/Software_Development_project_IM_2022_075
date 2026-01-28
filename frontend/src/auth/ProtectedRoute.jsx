import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { token, role } = useAuth();

  if (!token) return <Navigate to="/auth/signin" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
