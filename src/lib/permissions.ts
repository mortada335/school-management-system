/**
 * Role-based access control helpers.
 * Roles: superadmin > admin > teacher > student
 */
import type { Role } from "@/types";

export type Permission =
  | "manage:school"       // superadmin only
  | "manage:users"        // superadmin, admin
  | "manage:teachers"     // superadmin, admin
  | "manage:classes"      // superadmin, admin
  | "manage:subjects"     // superadmin, admin
  | "manage:students"     // superadmin, admin
  | "manage:fees"         // superadmin, admin
  | "manage:announcements"// superadmin, admin
  | "record:attendance"   // superadmin, admin, teacher
  | "record:grades"       // superadmin, admin, teacher
  | "view:attendance"     // all
  | "view:grades"         // all
  | "view:fees"           // all
  | "view:announcements"  // all
  | "view:overview"       // all
  | "seed:data";          // superadmin only

const rolePermissions: Record<Role, Permission[]> = {
  superadmin: [
    "manage:school", "manage:users", "manage:teachers", "manage:classes",
    "manage:subjects", "manage:students", "manage:fees", "manage:announcements",
    "record:attendance", "record:grades",
    "view:attendance", "view:grades", "view:fees", "view:announcements", "view:overview",
    "seed:data",
  ],
  admin: [
    "manage:users", "manage:teachers", "manage:classes",
    "manage:subjects", "manage:students", "manage:fees", "manage:announcements",
    "record:attendance", "record:grades",
    "view:attendance", "view:grades", "view:fees", "view:announcements", "view:overview",
  ],
  teacher: [
    "record:attendance", "record:grades",
    "view:attendance", "view:grades", "view:fees", "view:announcements", "view:overview",
  ],
  student: [
    "view:grades", "view:fees", "view:announcements", "view:overview",
  ],
};

export function hasPermission(role: Role | null, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canManage(role: Role | null): boolean {
  return role === "superadmin" || role === "admin";
}

export function canTeach(role: Role | null): boolean {
  return role === "superadmin" || role === "admin" || role === "teacher";
}
