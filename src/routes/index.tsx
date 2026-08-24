// ─── routes.tsx ───────────────────────────────────────────────────────────────
// Single source of truth for the entire route tree.
// Add, remove, or reorder pages here — nothing else needs to change.

import React, { Suspense } from 'react';
import { Route, Navigate, Routes } from 'react-router-dom';
import AppLayout from "@/components/layout/AppLayout";

// Lazy loaded pages
const Login = React.lazy(() => import("@/pages/Login"));
const Signup = React.lazy(() => import("@/pages/Signup"));
const SeedPage = React.lazy(() => import("@/pages/SeedPage"));
const Overview = React.lazy(() => import("@/pages/Overview"));
const Classes = React.lazy(() => import("@/pages/Classes"));
const Subjects = React.lazy(() => import("@/pages/Subjects"));
const Teachers = React.lazy(() => import("@/pages/Teachers"));
const Students = React.lazy(() => import("@/pages/Students"));
const StudentProfile = React.lazy(() => import("@/pages/StudentProfile"));
const Attendance = React.lazy(() => import("@/pages/Attendance"));
const Grades = React.lazy(() => import("@/pages/Grades"));
const Fees = React.lazy(() => import("@/pages/Fees"));
const Announcements = React.lazy(() => import("@/pages/Announcements"));

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

function Loader() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
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
    <Suspense fallback={<Loader />}>
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
    </Suspense>
  );
}
