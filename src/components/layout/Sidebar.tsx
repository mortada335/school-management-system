// ─── Sidebar.tsx ─────────────────────────────────────────────────────────────
import { useRef, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Library, GraduationCap, Users,
  ClipboardCheck, BarChart2, CreditCard, Megaphone,
  LogOut, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_ROUTES = [
  { key: "overview",      to: "/dashboard",               end: true,  Icon: LayoutDashboard },
  { key: "classes",       to: "/dashboard/classes",                   Icon: BookOpen        },
  { key: "subjects",      to: "/dashboard/subjects",                  Icon: Library         },
  { key: "teachers",      to: "/dashboard/teachers",                  Icon: GraduationCap   },
  { key: "students",      to: "/dashboard/students",                  Icon: Users           },
  { key: "attendance",    to: "/dashboard/attendance",                Icon: ClipboardCheck  },
  { key: "grades",        to: "/dashboard/grades",                    Icon: BarChart2       },
  { key: "fees",          to: "/dashboard/fees",                      Icon: CreditCard      },
  { key: "announcements", to: "/dashboard/announcements",             Icon: Megaphone       },
];

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; dot: string; avatar: string }> = {
  superadmin: { label: "Super Admin", dot: "bg-amber-400",   avatar: "from-amber-400 to-orange-500"  },
  admin:      { label: "Admin",       dot: "bg-indigo-400",  avatar: "from-indigo-500 to-violet-600" },
  teacher:    { label: "Teacher",     dot: "bg-emerald-400", avatar: "from-emerald-400 to-teal-500"  },
  student:    { label: "Student",     dot: "bg-sky-400",     avatar: "from-sky-400 to-blue-500"      },
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

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
  const expanded    = open;

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={[
        "fixed inset-y-0 z-50 flex flex-col",
        "bg-white dark:bg-[#0d0d14]",
        isRtl ? "right-0 border-l border-gray-100 dark:border-white/[0.06]"
              : "left-0 border-r border-gray-100 dark:border-white/[0.06]",
        "transition-[width,transform] duration-300 ease-in-out",
        expanded ? "w-60" : "w-[68px]",
        isMobile && !open
          ? isRtl ? "translate-x-full" : "-translate-x-full"
          : "translate-x-0",
        "lg:relative lg:translate-x-0",
      ].join(" ")}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className={[
        "flex h-14 shrink-0 items-center gap-3",
        "border-b border-gray-100 dark:border-white/[0.06]",
        expanded ? "px-3.5" : "justify-center px-0",
      ].join(" ")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-500/25">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2} />
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

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-px">
        {expanded && (
          <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 select-none">
            {lang === "ar" ? "القائمة" : "Menu"}
          </p>
        )}
        {NAV_ROUTES.map(({ key, to, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => isMobile && onClose()}
            title={!expanded ? String(t(key)) : undefined}
            className={({ isActive }) => [
              "group flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium outline-none",
              "transition-colors duration-100",
              expanded ? "gap-3" : "justify-center gap-0",
              isActive
                ? "bg-indigo-600 text-white"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-gray-100",
            ].join(" ")}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300",
                  ].join(" ")}
                  strokeWidth={1.75}
                />
                {expanded && <span className="truncate leading-none">{t(key)}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User section ─────────────────────────────────────────────────── */}
      <div ref={menuRef} className="relative shrink-0 border-t border-gray-100 dark:border-white/[0.06] p-2">
        {/* User dropdown panel */}
        {userMenuOpen && (
          <div className={[
            "absolute bottom-full mb-2 rounded-xl border border-gray-200 dark:border-white/[0.08]",
            "bg-white dark:bg-[#17172a] shadow-2xl overflow-hidden z-50",
            expanded ? "left-2 right-2" : "left-2 w-52",
          ].join(" ")}>
            <div className="px-3.5 py-3 border-b border-gray-100 dark:border-white/[0.06]">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{name}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{email}</p>
              <span className="mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {cfg.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {t("logout")}
            </button>
          </div>
        )}

        {/* Trigger */}
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          className={[
            "flex w-full items-center rounded-lg px-2 py-2 transition-colors",
            "hover:bg-gray-100 dark:hover:bg-white/[0.06]",
            "outline-none focus-visible:ring-2 ring-indigo-500",
            expanded ? "gap-2.5" : "justify-center",
          ].join(" ")}
        >
          <div className={[
            "relative shrink-0 flex h-8 w-8 items-center justify-center rounded-lg",
            `bg-gradient-to-br ${cfg.avatar}`,
            "text-white text-xs font-bold shadow-sm",
          ].join(" ")}>
            {avi}
            <span className={[
              "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full",
              "border-[1.5px] border-white dark:border-[#0d0d14]",
              cfg.dot,
            ].join(" ")} />
          </div>
          {expanded && (
            <>
              <div className="min-w-0 flex-1 overflow-hidden text-left">
                <p className="truncate text-[12px] font-semibold text-gray-900 dark:text-white leading-tight">{name}</p>
                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{cfg.label}</p>
              </div>
              <ChevronUp
                className={["h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform", userMenuOpen ? "" : "rotate-180"].join(" ")}
                strokeWidth={2}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
