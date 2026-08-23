import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useTranslation } from "@/lib/i18n";
import {
  countDocuments,
  fetchCollection,
  formatIQD,
  where,
  orderBy,
} from "@/lib/firestore-helpers";
import type { Announcement, Fee, AttendanceRecord, Grade, Student } from "@/types";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Skeleton, SkeletonChart } from "@/components/ui/Skeleton";

// ── Icon helpers ──────────────────────────────────────────────────────────────
function IconStudents() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
    </svg>
  );
}
function IconTeachers() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.26.897-.731 1.026a24.49 24.49 0 0 1-10.608.149ZM13.882 15.65a4.5 4.5 0 0 0-7.382-3.15 7.472 7.472 0 0 1 6.368 3.023c.373-.038.745-.084 1.014-.127Z" />
    </svg>
  );
}
function IconClasses() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M2 4.75C2 3.784 2.784 3 3.75 3h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 16.25 17H3.75A1.75 1.75 0 0 1 2 15.25V4.75ZM3.75 4.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V4.75a.25.25 0 0 0-.25-.25H3.75Z" />
    </svg>
  );
}
function IconFees() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.187 2.187 0 0 0-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696V15a.75.75 0 0 1-1.5 0v-.28a3.782 3.782 0 0 1-1.653-.713c-.426-.33-.744-.74-.924-1.2a.75.75 0 1 1 1.395-.55 1.35 1.35 0 0 0 .447.563c.284.22.645.37 1.035.432v-2.8c-.698-.093-1.383-.32-1.96-.696C6.513 10.616 6 9.86 6 9c0-.86.504-1.616 1.29-2.13A3.78 3.78 0 0 1 9 6.166V4.75A.75.75 0 0 1 10 4Z" clipRule="evenodd" />
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;  // Tailwind color class e.g. "indigo"
  loading: boolean;
  sub?: string;
}

function StatCard({ label, value, icon, accent, loading, sub }: StatCardProps) {
  const accentMap: Record<string, { icon: string; badge: string }> = {
    indigo:  { icon: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",  badge: "text-indigo-600 dark:text-indigo-400" },
    violet:  { icon: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",  badge: "text-violet-600 dark:text-violet-400" },
    sky:     { icon: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400",              badge: "text-sky-600 dark:text-sky-400" },
    emerald: { icon: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", badge: "text-emerald-600 dark:text-emerald-400" },
  };
  const colors = accentMap[accent] ?? accentMap.indigo;

  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-5 transition-shadow hover:shadow-md dark:hover:shadow-none dark:hover:border-white/[0.1]">
      {/* Top row: icon + label */}
      <div className="flex items-start justify-between gap-2">
        <div className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", colors.icon].join(" ")}>
          {icon}
        </div>
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 text-right leading-tight mt-0.5">{label}</span>
      </div>

      {/* Value */}
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
        )}
        {sub && !loading && (
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── KPI strip item ─────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  loading: boolean;
  children: React.ReactNode;
}
function KpiCard({ label, loading, children }: KpiProps) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">{label}</p>
      {loading ? <Skeleton className="h-8 w-24 mb-1" /> : children}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {action}
    </div>
  );
}

// ── Chart card ────────────────────────────────────────────────────────────────
function ChartCard({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-5">
      <SectionHeader title={title} />
      {loading ? <SkeletonChart height={180} /> : children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Overview() {
  const { user, profile, school, schoolId } = useAuth();
  const { isDark } = useTheme();
  const { activeYear } = useAcademicYear();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const firstName = (profile?.displayName ?? user?.displayName ?? user?.email ?? "").split(" ")[0] || "Admin";

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount]   = useState<number | null>(null);
  const [teacherCount, setTeacherCount]   = useState<number | null>(null);
  const [classCount, setClassCount]       = useState<number | null>(null);
  const [feesCollected, setFeesCollected] = useState<number | null>(null);
  const [totalBilled, setTotalBilled]     = useState<number | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<{ present: number; total: number } | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<{ date: string; pct: number }[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<{ name: string; value: number }[]>([]);
  const [topStudents, setTopStudents]     = useState<{ name: string; avg: number }[]>([]);
  const [overdueCount, setOverdueCount]   = useState(0);
  const [feesByMonth, setFeesByMonth]     = useState<{ month: string; paid: number; unpaid: number }[]>([]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!schoolId) return;
    const today = new Date().toISOString().split("T")[0];
    setLoading(true);
    try {
      const [sCount, tCount, cCount, allFees, annList, todayAtt, allGrades, allStudents, allAttendance] =
        await Promise.all([
          countDocuments(schoolId, "students",    [where("enrollmentYear", "==", activeYear)]),
          countDocuments(schoolId, "teachers"),
          countDocuments(schoolId, "classes",     [where("academicYear", "==", activeYear)]),
          fetchCollection<Fee>(schoolId, "fees",  [where("academicYear", "==", activeYear)]),
          fetchCollection<Announcement>(schoolId, "announcements", [
            where("academicYear", "==", activeYear),
            orderBy("createdAt", "desc"),
          ]),
          fetchCollection<AttendanceRecord>(schoolId, "attendance", [
            where("academicYear", "==", activeYear),
            where("date", "==", today),
          ]),
          fetchCollection<Grade>(schoolId, "grades",   [where("academicYear", "==", activeYear)]),
          fetchCollection<Student>(schoolId, "students",[where("enrollmentYear", "==", activeYear)]),
          fetchCollection<AttendanceRecord>(schoolId, "attendance", [where("academicYear", "==", activeYear)]),
        ]);

      setStudentCount(sCount);
      setTeacherCount(tCount);
      setClassCount(cCount);

      const paid  = allFees.filter(f => f.status === "paid").reduce((a, f) => a + f.amount, 0);
      const total = allFees.reduce((a, f) => a + f.amount, 0);
      setFeesCollected(paid);
      setTotalBilled(total);
      setOverdueCount(allFees.filter(f => f.status !== "paid" && f.dueDate && f.dueDate < today).length);

      setRecentAnnouncements(annList.slice(0, 3));

      const presentToday = todayAtt.filter(a => a.status === "present" || a.status === "late").length;
      setTodayAttendance({ present: presentToday, total: todayAtt.length });

      const passCount = allGrades.filter(g => g.score / g.maxScore >= 0.5).length;
      setGradeDistribution([
        { name: String(t("pass")), value: passCount },
        { name: String(t("fail")), value: allGrades.length - passCount },
      ]);

      const scoreMap: Record<string, number[]> = {};
      for (const g of allGrades) {
        (scoreMap[g.studentId] ??= []).push(Math.round((g.score / g.maxScore) * 100));
      }
      const studentMap: Record<string, string> = {};
      for (const s of allStudents) studentMap[s.id] = s.name;
      setTopStudents(
        Object.entries(scoreMap)
          .map(([id, scores]) => ({ name: studentMap[id] ?? id, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5)
      );

      const monthMap: Record<string, { paid: number; unpaid: number }> = {};
      for (const f of allFees) {
        const k = f.dueDate ? f.dueDate.substring(0, 7) : "—";
        (monthMap[k] ??= { paid: 0, unpaid: 0 });
        if (f.status === "paid") monthMap[k].paid += f.amount;
        else monthMap[k].unpaid += f.amount;
      }
      setFeesByMonth(
        Object.entries(monthMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([m, v]) => ({ month: m.substring(5), ...v }))
      );

      const last7: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last7.push(d.toISOString().split("T")[0]);
      }
      setAttendanceTrend(
        last7.map(date => {
          const day = allAttendance.filter(a => a.date === date);
          const p   = day.filter(a => a.status === "present" || a.status === "late").length;
          return { date: date.substring(5), pct: day.length ? Math.round((p / day.length) * 100) : 0 };
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear, t]);

  useEffect(() => { load(); }, [load]);

  // ── Chart theme ────────────────────────────────────────────────────────────
  const gridStroke   = isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9";
  const axisColor    = isDark ? "#6b7280" : "#94a3b8";
  const tooltipStyle = isDark
    ? { backgroundColor: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#f3f4f6", fontSize: 12 }
    : { backgroundColor: "#fff",    border: "1px solid #e2e8f0", borderRadius: 10, color: "#111827", fontSize: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" };

  const collectionRate = totalBilled ? Math.round(((feesCollected ?? 0) / totalBilled) * 100) : 0;
  const todayPct       = todayAttendance?.total ? Math.round((todayAttendance.present / todayAttendance.total) * 100) : null;

  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("welcomeBack")}, {firstName}
        </h2>
        <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
          {school?.name ?? "—"} &middot; <span className="text-indigo-500 dark:text-indigo-400 font-medium">{activeYear}</span>
        </p>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard loading={loading} label={String(t("totalStudents"))} value={studentCount?.toLocaleString() ?? "0"} icon={<IconStudents />} accent="indigo" />
        <StatCard loading={loading} label={String(t("totalTeachers"))} value={teacherCount?.toLocaleString() ?? "0"} icon={<IconTeachers />} accent="violet" />
        <StatCard loading={loading} label={String(t("totalClasses"))}  value={classCount?.toLocaleString()   ?? "0"} icon={<IconClasses />}  accent="sky" />
        <StatCard loading={loading} label={String(t("feesCollected"))} value={feesCollected !== null ? formatIQD(feesCollected) : "0"} icon={<IconFees />} accent="emerald" sub={totalBilled ? `of ${formatIQD(totalBilled)}` : undefined} />
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

        {/* Today attendance */}
        <KpiCard label={String(t("todayAttendance"))} loading={loading}>
          {todayPct !== null ? (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayPct}%</p>
              <p className="mt-1 text-[11px] text-gray-400">{todayAttendance?.present}/{todayAttendance?.total} {t("present")}</p>
              <div className="mt-2 h-1 w-full rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${todayPct}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">{t("noAttendanceToday")}</p>
          )}
        </KpiCard>

        {/* Collection rate */}
        <KpiCard label={String(t("collectionRate"))} loading={loading}>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{collectionRate}%</p>
          <p className="mt-1 text-[11px] text-gray-400">{formatIQD(feesCollected ?? 0)} / {formatIQD(totalBilled ?? 0)}</p>
          <div className="mt-2 h-1 w-full rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${collectionRate}%` }} />
          </div>
        </KpiCard>

        {/* Overdue */}
        <KpiCard label={String(t("overdueFees"))} loading={loading}>
          <p className={["text-2xl font-bold", overdueCount > 0 ? "text-amber-500" : "text-gray-900 dark:text-white"].join(" ")}>
            {overdueCount}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">{t("overdueRecords")}</p>
        </KpiCard>

      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title={`${t("attendanceTrend")} — 7 ${t("days") || "days"}`} loading={loading}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={attendanceTrend} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 10 }} unit="%" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string | readonly (number | string)[] | undefined) => [`${v ?? ""}%`, t("present")]} />
              <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={String(t("monthlyRevenue"))} loading={loading}>
          {feesByMonth.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400">{t("noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={feesByMonth} barSize={14} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string | readonly (number | string)[] | undefined) => formatIQD(Number(v ?? 0))} />
                <Bar dataKey="paid"   fill="#10b981" name={String(t("paid"))}   radius={[4, 4, 0, 0]} />
                <Bar dataKey="unpaid" fill="#f43f5e" name={String(t("unpaid"))} radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11, color: axisColor, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>

      {/* ── Grade distribution + Top students ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pass/Fail donut */}
        <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-5">
          <SectionHeader title={`${t("academicPerformance")} — ${t("passRate") || "Pass / Fail"}`} />
          {loading ? (
            <SkeletonChart height={150} />
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" paddingAngle={3}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {gradeDistribution.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className={["h-2.5 w-2.5 rounded-full shrink-0", i === 0 ? "bg-emerald-500" : "bg-rose-500"].join(" ")} />
                    <span className="text-[12px] text-gray-500 dark:text-gray-400">{d.name}</span>
                    <span className="text-[13px] font-bold text-gray-900 dark:text-white ms-auto">{d.value}</span>
                  </div>
                ))}
                {gradeDistribution.length > 0 && (
                  <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-white/[0.05]">
                    {gradeDistribution.reduce((a, d) => a + d.value, 0)} total grades
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top students */}
        <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-5">
          <SectionHeader title={String(t("topStudentsLeaderboard"))} />
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : topStudents.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">{t("noGradesRecorded")}</p>
          ) : (
            <div className="space-y-2">
              {topStudents.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <span className="w-6 text-center text-sm shrink-0">
                    {i < 3 ? MEDAL[i] : <span className="text-[11px] font-bold text-gray-400">#{i + 1}</span>}
                  </span>
                  <span className="flex-1 min-w-0 text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate">{s.name}</span>
                  <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{s.avg}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Recent announcements ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-5">
        <SectionHeader
          title={String(t("recentAnnouncements"))}
          action={
            <button
              onClick={() => navigate("/dashboard/announcements")}
              className="text-[12px] font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            >
              {t("viewAll")} →
            </button>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-white/[0.05] p-3">
                <Skeleton className="h-3.5 flex-1" />
                <Skeleton className="h-5 w-16 shrink-0" />
              </div>
            ))}
          </div>
        ) : recentAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t("noRecentAnnouncements")}</p>
        ) : (
          <div className="space-y-2.5">
            {recentAnnouncements.map(ann => {
              const title = lang === "ar" ? ann.title : (ann.titleEn || ann.title);
              const body  = lang === "ar" ? ann.body  : (ann.bodyEn  || ann.body);
              const priorityColor: Record<string, string> = {
                urgent: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
                normal: "bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400",
                info:   "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400",
              };
              const pc = priorityColor[ann.priority as string] ?? priorityColor.normal;
              return (
                <div
                  key={ann.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 dark:border-white/[0.05] px-3.5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{title}</p>
                    <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400 line-clamp-1">{body}</p>
                  </div>
                  <span className={["shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize", pc].join(" ")}>
                    {ann.priority}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
