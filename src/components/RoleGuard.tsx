import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, type Permission } from "@/lib/permissions";

interface RoleGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only if the current user has the required permission.
 * Optionally renders a fallback element otherwise.
 */
export default function RoleGuard({ permission, children, fallback = null }: RoleGuardProps) {
  const { role } = useAuth();
  if (!hasPermission(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
