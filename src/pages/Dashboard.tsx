import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navItems = [
  {
    label: "Overview",
    to: "/dashboard",
    end: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Classes",
    to: "/dashboard/classes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M2 4.75C2 3.784 2.784 3 3.75 3h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 16.25 17H3.75A1.75 1.75 0 0 1 2 15.25V4.75ZM3.75 4.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V4.75a.25.25 0 0 0-.25-.25H3.75Z" />
      </svg>
    ),
  },
  {
    label: "Subjects",
    to: "/dashboard/subjects",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M10 2c-3.866 0-7 1.79-7 4v8c0 2.21 3.134 4 7 4s7-1.79 7-4V6c0-2.21-3.134-4-7-4Zm0 2.5c2.946 0 5 .973 5 1.5s-2.054 1.5-5 1.5-5-.973-5-1.5 2.054-1.5 5-1.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Teachers",
    to: "/dashboard/teachers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.26.897-.731 1.026a24.49 24.49 0 0 1-10.608.149ZM13.882 15.65a4.5 4.5 0 0 0-7.382-3.15 7.472 7.472 0 0 1 6.368 3.023c.373-.038.745-.084 1.014-.127Z" />
      </svg>
    ),
  },
  {
    label: "Students",
    to: "/dashboard/students",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
      </svg>
    ),
  },
  {
    label: "Attendance",
    to: "/dashboard/attendance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Grades",
    to: "/dashboard/grades",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684Z" />
      </svg>
    ),
  },
  {
    label: "Fees",
    to: "/dashboard/fees",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.576Z" />
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.187 2.187 0 0 0-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696V15a.75.75 0 0 1-1.5 0v-.28a3.782 3.782 0 0 1-1.653-.713c-.426-.33-.744-.74-.924-1.2a.75.75 0 1 1 1.395-.55 1.35 1.35 0 0 0 .447.563c.284.22.645.37 1.035.432v-2.8c-.698-.093-1.383-.32-1.96-.696C6.513 10.616 6 9.86 6 9c0-.86.504-1.616 1.29-2.13A3.78 3.78 0 0 1 9 6.166V4.75A.75.75 0 0 1 10 4Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Announcements",
    to: "/dashboard/announcements",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M4.25 3A2.25 2.25 0 0 0 2 5.25v8.5A2.25 2.25 0 0 0 4.25 16h11.5A2.25 2.25 0 0 0 18 13.75v-8.5A2.25 2.25 0 0 0 15.75 3H4.25ZM3.5 5.25a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v1.272l-6.19 3.715a1.25 1.25 0 0 1-1.29 0L3.5 6.522V5.25Zm0 3.033 5.489 3.293a2.75 2.75 0 0 0 2.838 0L17.327 8.28v5.47a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75V8.283Z" />
      </svg>
    ),
  },
];

const roleBadgeColor: Record<string, string> = {
  superadmin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  teacher: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  student: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function Dashboard() {
  const { user, profile, school, role, logout } = useAuth();
  const { activeYear, setActiveYear, allYears } = useAcademicYear();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const displayName = profile?.displayName ?? user?.displayName ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const email = profile?.email ?? user?.email ?? "";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-100 antialiased">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col border-r border-white/10 bg-gray-900/90 backdrop-blur-md transition-all duration-200 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
              <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
              <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 1-8.105 2.571.75.75 0 0 1-.832-.621 48.494 48.494 0 0 1-.764-4.065v-.001c-.065-.542-.116-1.09-.148-1.637Z" />
              <path d="M5.072 15.282a48.553 48.553 0 0 1 7.664 3.282c-.163.91-.337 1.802-.523 2.676a47.856 47.856 0 0 1-8.107-2.57.75.75 0 0 1-.46-.71 48.462 48.462 0 0 1 .426-2.678Z" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <span className="truncate text-sm font-bold text-white tracking-wide block">
                EduSaaS
              </span>
              <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase block">
                School OS
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/40 shadow-sm"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="shrink-0 transition-transform group-hover:scale-110">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <Separator className="bg-white/10" />

        {/* User section */}
        <div className="p-3">
          <div
            className={`flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2.5 ${
              sidebarOpen ? "" : "justify-center"
            }`}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-indigo-500/30">
              <AvatarFallback className="bg-indigo-600 text-xs font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {displayName}
                </p>
                <p className="truncate text-[10px] text-gray-400">
                  {email}
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && role && (
            <div className="mt-2 px-1 flex items-center justify-between">
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide capitalize ${
                  roleBadgeColor[role] ?? roleBadgeColor.student
                }`}
              >
                {role}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-gray-900/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
              </svg>
            </button>

            {school && (
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <span className="text-sm font-bold text-white tracking-tight">{school.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Academic Year Selector */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.939.831a1 1 0 00.788 0l7-3a1 1 0 000-1.84l-7-3z" />
                <path d="M4.608 10.121L2.394 9.172a1 1 0 00-1.182.28 1 1 0 00.28 1.182l2.608 1.118a3.001 3.001 0 002.392 0l7.394-3.169a1 1 0 00.514-.547l.9-2.1a1 1 0 00-1.838-.788l-.707 1.65-6.755 2.895a1 1 0 01-.794 0z" />
              </svg>
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">Academic Year:</span>
              <Select value={activeYear} onValueChange={(a) => setActiveYear(a as string)}>
                <SelectTrigger className="h-7 border-none bg-transparent text-xs font-semibold text-white focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/10 text-white">
                  {allYears.map((year) => (
                    <SelectItem key={year} value={year} className="text-xs">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="me-2 h-4 w-4">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.007a.75.75 0 1 0-1.04-1.082l-2.5 2.4a.75.75 0 0 0 0 1.082l2.5 2.4a.75.75 0 1 0 1.04-1.082L8.704 10.75H18.25A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
              </svg>
              Sign out
            </Button>
          </div>
        </header>

        {/* Page outlet */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
