// ─── Navbar.tsx ───────────────────────────────────────────────────────────────
import { Menu, Sun, Moon, Calendar } from "lucide-react";
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

export default function Navbar({ sidebarOpen: _, onToggleSidebar }: NavbarProps) {
  const { profile, user, school } = useAuth();
  const { activeYear, setActiveYear, allYears } = useAcademicYear();
  const { isDark, toggleTheme } = useTheme();
  const { t, lang, setLang } = useTranslation();

  const displayName = profile?.displayName ?? user?.displayName ?? user?.email ?? "";

  return (
    <header className={[
      "sticky top-0 z-30 flex h-14 shrink-0 items-center",
      "border-b border-gray-100 dark:border-white/[0.06]",
      "bg-white/95 dark:bg-[#0d0d14]/95 backdrop-blur-xl",
      "px-3 sm:px-5 gap-3 transition-colors",
    ].join(" ")}>

      {/* Left: toggle + school name */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 ring-indigo-500"
        >
          <Menu className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {school?.name ?? "—"}
          </p>
          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
            {displayName}
          </p>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex shrink-0 items-center gap-1.5">

        {/* Academic year */}
        <div className="flex items-center gap-1.5 h-8 rounded-lg px-2 border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04]">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" strokeWidth={2} />
          <Select value={activeYear} onValueChange={v => { if (v) setActiveYear(v); }}>
            <SelectTrigger className="h-6 w-[98px] sm:w-[110px] border-0 bg-transparent p-0 text-xs font-medium text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none shadow-none">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#17172a] text-gray-900 dark:text-white shadow-xl">
              {allYears.map(y => (
                <SelectItem key={y} value={y} className="text-xs rounded-lg">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.08] mx-0.5" />

        {/* Theme */}
        <button
          onClick={toggleTheme}
          title={isDark ? String(t("lightMode")) : String(t("darkMode"))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-gray-100 transition-colors outline-none focus-visible:ring-2 ring-indigo-500"
        >
          {isDark
            ? <Sun  className="h-4 w-4 text-amber-400" strokeWidth={2} />
            : <Moon className="h-4 w-4 text-indigo-500" strokeWidth={2} />
          }
        </button>

        {/* Language */}
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="flex h-8 items-center justify-center rounded-lg px-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-gray-100 transition-colors outline-none focus-visible:ring-2 ring-indigo-500 border border-gray-200 dark:border-white/[0.08]"
        >
          {lang === "ar" ? "EN" : "عربي"}
        </button>
      </div>
    </header>
  );
}
