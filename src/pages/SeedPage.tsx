import { useState } from "react";
import { seedDemoData } from "@/lib/seed";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";

export default function SeedPage() {
  const { t, lang, setLang } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const handleSeed = async () => {
    setRunning(true);
    setLog([]);
    setDone(false);
    setError(null);
    try {
      await seedDemoData(appendLog);
      setDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      appendLog(`❌ Error: ${message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 transition-colors">
      {/* Top right quick settings */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors shadow-2xs"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors shadow-2xs"
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>

      <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl dark:border-white/10 dark:bg-gray-900/80 dark:backdrop-blur-md my-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30 text-2xl">
            🌱
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("seedData")}</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("seedDescription")}</p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-4 mb-6 dark:border-indigo-500/20 dark:bg-indigo-500/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3">Demo Accounts (after seeding)</p>
          <div className="space-y-1.5 font-mono text-xs">
            {[
              { role: "superadmin", color: "text-amber-700 dark:text-amber-400" },
              { role: "admin", color: "text-indigo-700 dark:text-indigo-400" },
              { role: "teacher", color: "text-emerald-700 dark:text-emerald-400" },
              { role: "student", color: "text-cyan-700 dark:text-cyan-400" },
            ].map(({ role, color }) => (
              <div key={role} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className={`font-semibold sm:w-24 ${color}`}>{role}</span>
                <span className="text-gray-800 dark:text-gray-300">{role}@demo.school</span>
                <span className="text-gray-500">/ Demo@12345</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleSeed}
          disabled={running || done}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? t("seeding") : done ? "✅ Completed!" : t("seedButton")}
        </button>

        {/* Log */}
        {log.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-800 space-y-1 max-h-72 overflow-y-auto dark:border-white/10 dark:bg-black/30 dark:text-gray-300">
            {log.map((line, i) => (
              <div key={i} className={line.startsWith("❌") ? "text-rose-600 dark:text-rose-400" : line.startsWith("✅") || line.startsWith("🎉") ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}>
                {line}
              </div>
            ))}
          </div>
        )}

        {done && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-4 text-xs sm:text-sm font-medium text-center dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            ✅ {t("seedSuccess")} Go to{" "}
            <a href="/login" className="underline font-bold">Login</a> and sign in with any demo account.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-4 text-xs sm:text-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}
