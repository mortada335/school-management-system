// ─── Navbar.tsx ───────────────────────────────────────────────────────────────
// Top navigation bar. Stateless except for the sidebar toggle handler it receives.

import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  const { profile, user, school } = useAuth();
  const { activeYear, setActiveYear, allYears } = useAcademicYear();
  const { isDark, toggleTheme } = useTheme();
  const { t, lang, setLang } = useTranslation();

  const displayName = profile?.displayName ?? user?.displayName ?? user?.email ?? "";

  return (
    <header className={[
      "sticky top-0 z-30 flex h-14 shrink-0 items-center",
      "border-b border-gray-100 dark:border-white/[0.05]",
      "bg-white/95 dark:bg-[#0c0c14]/95 backdrop-blur-xl",
      "px-3 sm:px-5 gap-3",
      "transition-colors",
    ].join(" ")}>

      {/* ── Left: toggle + breadcrumb ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "text-gray-500 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white",
            "transition-colors outline-none focus-visible:ring-2 ring-indigo-500",
          ].join(" ")}
        >
          {/* Icon changes based on sidebar state */}
          {sidebarOpen ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* School name */}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {school?.name ?? "—"}
          </p>
          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
            {displayName}
          </p>
        </div>
      </div>

      {/* ── Right: controls ───────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-1.5">

        {/* Academic year selector */}
        <div className={[
          "flex items-center gap-1.5 h-8 rounded-lg px-2",
          "border border-gray-200 dark:border-white/[0.07]",
          "bg-gray-50 dark:bg-white/[0.03]",
        ].join(" ")}>
          {/* Calendar icon */}
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400">
            <path fillRule="evenodd" d="M4.75 1a.75.75 0 0 1 .75.75V3h5V1.75a.75.75 0 0 1 1.5 0V3h.25A2.75 2.75 0 0 1 15 5.75v7.5A2.75 2.75 0 0 1 12.25 16H3.75A2.75 2.75 0 0 1 1 13.25v-7.5A2.75 2.75 0 0 1 3.75 3H4V1.75A.75.75 0 0 1 4.75 1ZM3.75 4.5c-.69 0-1.25.56-1.25 1.25V6h11v-.25c0-.69-.56-1.25-1.25-1.25H3.75ZM2.5 7.5v5.75c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V7.5h-11Z" clipRule="evenodd" />
          </svg>

          <Select value={activeYear} onValueChange={(v) => setActiveYear(v as string)}>
            <SelectTrigger className="h-6 w-[98px] sm:w-[110px] border-0 bg-transparent p-0 text-xs font-medium text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none shadow-none">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#17172a] text-gray-900 dark:text-white shadow-xl">
              {allYears.map((y) => (
                <SelectItem key={y} value={y} className="text-xs rounded-lg">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.07] mx-0.5" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? String(t("lightMode")) : String(t("darkMode"))}
          className={[
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-gray-500 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-gray-100",
            "transition-colors outline-none focus-visible:ring-2 ring-indigo-500",
          ].join(" ")}
        >
          {isDark ? (
            // Sun icon
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-400">
              <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.657-1.657a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.062-1.06l1.061-1.061a.75.75 0 0 1 1.061 0Zm-9.193 9.192a.75.75 0 0 1 0 1.061l-1.06 1.06a.75.75 0 0 1-1.062-1.06l1.061-1.061a.75.75 0 0 1 1.061 0ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10Zm9.657 4.95a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.062l-1.061-1.061a.75.75 0 0 1 0-1.061ZM4.343 5.757a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 1 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061Z" />
            </svg>
          ) : (
            // Moon icon
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-500">
              <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className={[
            "flex h-8 items-center justify-center rounded-lg px-2.5",
            "text-[11px] font-semibold text-gray-600 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-gray-100",
            "transition-colors outline-none focus-visible:ring-2 ring-indigo-500",
            "border border-gray-200 dark:border-white/[0.07]",
          ].join(" ")}
        >
          {lang === "ar" ? "EN" : "عربي"}
        </button>
      </div>
    </header>
  );
}
