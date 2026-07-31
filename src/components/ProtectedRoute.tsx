import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types";

interface ProtectedRouteProps {
  /** If provided, only these roles can access the route */
  allowedRoles?: Role[];
}

/**
 * Wraps routes that require authentication.
 * - Unauthenticated → /login
 * - Wrong role → /unauthorized
 * - Loading → blank screen (prevents flash)
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    // Prevent redirect flash while Firebase resolves auth state
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
