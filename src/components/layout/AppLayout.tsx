// ─── AppLayout.tsx ────────────────────────────────────────────────────────────
// The authenticated app shell — auth guard + sidebar + navbar + content.
//
// Responsibilities:
//   1. Guard: redirect to /login if unauthenticated (replaces ProtectedRoute)
//   2. Layout: sidebar, navbar, scrollable content area
//   3. State: sidebar open/collapsed + mobile breakpoint detection
//
// This component is the single <Route element> that wraps all dashboard routes
// in App.tsx, so there's no need for a separate ProtectedRoute wrapper.

import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const LG = 1024; // Tailwind `lg` breakpoint in px

// Minimal full-screen spinner shown while Firebase resolves auth state.
function AuthLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#09090f]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );
}

export default function AppLayout() {
  const { user, loading } = useAuth();

  const [isMobile, setIsMobile]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const sync = () => {
      const mobile = window.innerWidth < LG;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // desktop → open, mobile → closed
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (loading) return <AuthLoader />;
  if (!user)   return <Navigate to="/login" replace />;

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#09090f] text-gray-900 dark:text-gray-100 transition-colors duration-200">

      {/* Mobile overlay — closes sidebar on tap */}
      {isMobile && sidebarOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#09090f] transition-colors">
          <div className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
