// ─── Sidebar.tsx ─────────────────────────────────────────────────────────────
// Self-contained sidebar component.
// Receives open/collapsed state from the parent layout.

import React, { useRef, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";

// ── Nav icons (inline – no extra dep) ────────────────────────────────────────
const NAV_ICONS: Record<string, React.ReactElement> = {
  overview: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
    </svg>
  ),
  classes: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M2 4.75C2 3.784 2.784 3 3.75 3h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 16.25 17H3.75A1.75 1.75 0 0 1 2 15.25V4.75ZM3.75 4.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V4.75a.25.25 0 0 0-.25-.25H3.75Z" />
    </svg>
  ),
  subjects: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
    </svg>
  ),
  teachers: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.26.897-.731 1.026a24.49 24.49 0 0 1-10.608.149ZM13.882 15.65a4.5 4.5 0 0 0-7.382-3.15 7.472 7.472 0 0 1 6.368 3.023c.373-.038.745-.084 1.014-.127Z" />
    </svg>
  ),
  students: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  ),
  grades: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684Z" />
    </svg>
  ),
  fees: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.187 2.187 0 0 0-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696V15a.75.75 0 0 1-1.5 0v-.28a3.782 3.782 0 0 1-1.653-.713c-.426-.33-.744-.74-.924-1.2a.75.75 0 1 1 1.395-.55 1.35 1.35 0 0 0 .447.563c.284.22.645.37 1.035.432v-2.8c-.698-.093-1.383-.32-1.96-.696C6.513 10.616 6 9.86 6 9c0-.86.504-1.616 1.29-2.13A3.78 3.78 0 0 1 9 6.166V4.75A.75.75 0 0 1 10 4Z" clipRule="evenodd" />
    </svg>
  ),
  announcements: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M13.92 3.845a19.361 19.361 0 0 1-6.3 1.98C6.765 5.942 5.89 6 5 6a4 4 0 0 0-.504 7.969l.39 2.652A1.25 1.25 0 0 0 6.12 17.7l.414-.303A2.75 2.75 0 0 1 8.5 16.878v0a2.75 2.75 0 0 1 2.75 2.75v0H13a1 1 0 0 0 .97-1.243l-.97-4.864A20.233 20.233 0 0 0 13.92 12a20.12 20.12 0 0 0 3.83-1.43A1 1 0 0 0 18 9.68V5.32a1 1 0 0 0-1.25-.966 20.12 20.12 0 0 1-2.83.49Z" />
    </svg>
  ),
};

const NAV_ROUTES = [
  { key: "overview",      to: "/dashboard",               end: true  },
  { key: "classes",       to: "/dashboard/classes"                   },
  { key: "subjects",      to: "/dashboard/subjects"                  },
  { key: "teachers",      to: "/dashboard/teachers"                  },
  { key: "students",      to: "/dashboard/students"                  },
  { key: "attendance",    to: "/dashboard/attendance"                },
  { key: "grades",        to: "/dashboard/grades"                    },
  { key: "fees",          to: "/dashboard/fees"                      },
  { key: "announcements", to: "/dashboard/announcements"             },
];

// ── Role configuration ────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; dot: string; avatar: string }> = {
  superadmin: { label: "Super Admin", dot: "bg-amber-400",   avatar: "from-amber-400 to-orange-500"  },
  admin:      { label: "Admin",       dot: "bg-indigo-400",  avatar: "from-indigo-500 to-violet-600" },
  teacher:    { label: "Teacher",     dot: "bg-emerald-400", avatar: "from-emerald-400 to-teal-500"  },
  student:    { label: "Student",     dot: "bg-sky-400",     avatar: "from-sky-400 to-blue-500"      },
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const { user, profile, role, logout } = useAuth();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const name        = profile?.displayName ?? user?.displayName ?? user?.email ?? "User";
  const email       = profile?.email ?? user?.email ?? "";
  const currentRole = role ?? "student";
  const cfg         = ROLE_CONFIG[currentRole] ?? ROLE_CONFIG.student;
  const avi         = initials(name);
  const isRtl       = lang === "ar";

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/login");
  };

  // Whether the sidebar shows labels (expanded) or just icons (collapsed)
  const expanded = isMobile ? open : open;

  return (
    <aside
      className={[
        // base
        "fixed inset-y-0 z-50 flex flex-col",
        "bg-white dark:bg-[#0c0c14]",
        "border-gray-100 dark:border-white/[0.05]",
        isRtl ? "right-0 border-l" : "left-0 border-r",
        // sizing + slide
        "transition-[width,transform] duration-300 ease-in-out",
        expanded ? "w-60" : "w-[68px]",
        // on mobile: slide off-screen when closed
        isMobile && !open
          ? isRtl
            ? "translate-x-full"
            : "-translate-x-full"
          : "translate-x-0",
        // on desktop: always visible
        "lg:relative lg:translate-x-0",
      ].join(" ")}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────────── */}
      <div className={[
        "flex h-14 shrink-0 items-center gap-3 px-3.5",
        "border-b border-gray-100 dark:border-white/[0.05]",
        !expanded && "justify-center px-0",
      ].join(" ")}>
        {/* Icon mark */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-500/30">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
            <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002-.114.06-.014.006a.75.75 0 0 1-.65.043A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
            <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 1-8.105 2.571.75.75 0 0 1-.832-.621 48.494 48.494 0 0 1-.764-4.065v-.001c-.065-.542-.116-1.09-.148-1.637Z" />
            <path d="M5.072 15.282a48.553 48.553 0 0 1 7.664 3.282c-.163.91-.337 1.802-.523 2.676a47.856 47.856 0 0 1-8.107-2.57.75.75 0 0 1-.46-.71 48.462 48.462 0 0 1 .426-2.678Z" />
          </svg>
        </div>

        {expanded && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white leading-none">EduSaaS</p>
            <p className="mt-0.5 truncate text-[10px] font-medium tracking-widest uppercase text-indigo-500 dark:text-indigo-400 leading-none">
              School OS
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-px">
        {expanded && (
          <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 select-none">
            {lang === "ar" ? "القائمة" : "Menu"}
          </p>
        )}

        {NAV_ROUTES.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => isMobile && onClose()}
            title={!expanded ? String(t(item.key)) : undefined}
            className={({ isActive }) => [
              "group flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium outline-none",
              "transition-colors duration-100",
              expanded ? "gap-3" : "justify-center gap-0",
              isActive
                ? "bg-indigo-600 text-white"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100",
            ].join(" ")}
          >
            {({ isActive }) => (
              <>
                <span className={[
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300",
                ].join(" ")}>
                  {NAV_ICONS[item.key]}
                </span>
                {expanded && (
                  <span className="truncate leading-none">{t(item.key)}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User section ─────────────────────────────────────────────────────── */}
      <div
        ref={menuRef}
        className="relative shrink-0 border-t border-gray-100 dark:border-white/[0.05] p-2"
      >
        {/* User dropdown panel */}
        {userMenuOpen && (
          <div className={[
            "absolute bottom-full mb-2 rounded-xl border border-gray-200 dark:border-white/[0.07]",
            "bg-white dark:bg-[#13131f] shadow-2xl overflow-hidden z-50",
            expanded ? "left-2 right-2" : "left-2 w-52",
          ].join(" ")}>
            {/* Identity header */}
            <div className="px-3.5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{name}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{email}</p>
              <span className={[
                "mt-2 inline-flex items-center rounded-md px-2 py-0.5",
                "text-[10px] font-semibold tracking-wide",
                "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
              ].join(" ")}>
                {cfg.label}
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path fillRule="evenodd" d="M17 4.25A2.25 2.25 0 0 0 14.75 2h-5.5A2.25 2.25 0 0 0 7 4.25v2a.75.75 0 0 0 1.5 0v-2a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75v-2a.75.75 0 0 0-1.5 0v2A2.25 2.25 0 0 0 9.25 18h5.5A2.25 2.25 0 0 0 17 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M1 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 0 1-1.004-1.114l1.048-.943H1.75A.75.75 0 0 1 1 10Z" clipRule="evenodd" />
              </svg>
              {t("logout")}
            </button>
          </div>
        )}

        {/* Trigger button */}
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className={[
            "flex w-full items-center rounded-lg px-2 py-2 transition-colors",
            "hover:bg-gray-100 dark:hover:bg-white/[0.05]",
            "outline-none focus-visible:ring-2 ring-indigo-500",
            expanded ? "gap-2.5" : "justify-center",
          ].join(" ")}
        >
          {/* Avatar */}
          <div className={[
            "relative shrink-0 flex h-8 w-8 items-center justify-center rounded-lg",
            `bg-gradient-to-br ${cfg.avatar}`,
            "text-white text-xs font-bold shadow-sm",
          ].join(" ")}>
            {avi}
            {/* Status dot */}
            <span className={[
              "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full",
              "border-[1.5px] border-white dark:border-[#0c0c14]",
              cfg.dot,
            ].join(" ")} />
          </div>

          {expanded && (
            <>
              <div className="min-w-0 flex-1 overflow-hidden text-left">
                <p className="truncate text-[12px] font-semibold text-gray-900 dark:text-white leading-tight">{name}</p>
                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{cfg.label}</p>
              </div>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={["h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform", userMenuOpen ? "rotate-180" : ""].join(" ")}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
