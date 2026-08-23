// ─── routes.tsx ───────────────────────────────────────────────────────────────
// Single source of truth for the entire route tree.
// Add, remove, or reorder pages here — nothing else needs to change.

import { Route, Navigate, Routes } from 'react-router-dom';
import AppLayout      from "@/components/layout/AppLayout";
import Login          from "@/pages/Login";
import Signup         from "@/pages/Signup";
import SeedPage       from "@/pages/SeedPage";
import Overview       from "@/pages/Overview";
import Classes        from "@/pages/Classes";
import Subjects       from "@/pages/Subjects";
import Teachers       from "@/pages/Teachers";
import Students       from "@/pages/Students";
import StudentProfile from "@/pages/StudentProfile";
import Attendance     from "@/pages/Attendance";
import Grades         from "@/pages/Grades";
import Fees           from "@/pages/Fees";
import Announcements  from "@/pages/Announcements";

function Unauthorized() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-[#09090f] text-center px-4">
      <p className="text-5xl mb-4">🔒</p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        You don't have permission to view this page.
      </p>
    </div>
  );
}

/**
 * AppRoutes — rendered inside <Routes> in App.tsx.
 *
 * Structure:
 *   /login, /signup, /seed, /unauthorized  →  public pages
 *   /dashboard/*                           →  AppLayout (auth guard + shell)
 *   *                                      →  redirect to /dashboard
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"        element={<Login />} />
      <Route path="/signup"       element={<Signup />} />
      <Route path="/seed"         element={<SeedPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected — AppLayout owns auth guard + sidebar + navbar */}
      <Route path="/dashboard" element={<AppLayout />}>
        <Route index                      element={<Overview />} />
        <Route path="classes"             element={<Classes />} />
        <Route path="subjects"            element={<Subjects />} />
        <Route path="teachers"            element={<Teachers />} />
        <Route path="students"            element={<Students />} />
        <Route path="students/:studentId" element={<StudentProfile />} />
        <Route path="attendance"          element={<Attendance />} />
        <Route path="grades"              element={<Grades />} />
        <Route path="fees"                element={<Fees />} />
        <Route path="announcements"       element={<Announcements />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
