import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/lib/i18n";
import { getDocument, fetchCollection, where, orderBy } from "@/lib/firestore-helpers";
import type { Student, Grade, Fee } from "@/types";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function formatIQD(amount: number) {
  return amount.toLocaleString() + " د.ع";
}

function letterGrade(score: number, max: number): { letter: string; color: string } {
  const pct = (score / max) * 100;
  if (pct >= 90) return { letter: "A+", color: "text-emerald-500 dark:text-emerald-400" };
  if (pct >= 85) return { letter: "A",  color: "text-emerald-500 dark:text-emerald-400" };
  if (pct >= 75) return { letter: "B",  color: "text-blue-500 dark:text-blue-400" };
  if (pct >= 65) return { letter: "C",  color: "text-amber-500 dark:text-yellow-400" };
  if (pct >= 50) return { letter: "D",  color: "text-orange-500 dark:text-orange-400" };
  return { letter: "F", color: "text-rose-500 dark:text-rose-400" };
}

interface AttendanceItem {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
}

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const { schoolId } = useAuth();
  const { isDark } = useTheme();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grades" | "attendance" | "fees">("grades");

  const loadData = useCallback(async () => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    try {
      const s = await getDocument<Student>(schoolId, "students", studentId);
      setStudent(s);

      const [gList, fList] = await Promise.all([
        fetchCollection<Grade>(schoolId, "grades", [
          where("studentId", "==", studentId),
          orderBy("subjectName"),
        ]),
        fetchCollection<Fee>(schoolId, "fees", [
          where("studentId", "==", studentId),
          orderBy("dueDate"),
        ]),
      ]);
      setGrades(gList);
      setFees(fList);

      interface AttendanceDoc {
        id: string;
        date: string;
        records?: Record<string, "present" | "absent" | "late" | "excused">;
        notes?: Record<string, string>;
      }
      const attDocs = await fetchCollection<AttendanceDoc>(schoolId, "attendance", [
        orderBy("date", "desc"),
      ]);

      const myAttendance: AttendanceItem[] = [];
      for (const doc of attDocs) {
        if (doc.records && doc.records[studentId]) {
          myAttendance.push({
            id: doc.id,
            date: doc.date,
            status: doc.records[studentId],
            notes: doc.notes?.[studentId],
          });
        }
      }
      setAttendance(myAttendance);
    } catch (err) {
      console.error("Error loading student profile:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="py-20 text-center text-gray-400 text-sm">{t("loading")}</div>;
  }

  if (!student) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold text-gray-900 dark:text-white">Student not found</p>
        <button onClick={() => navigate("/dashboard/students")} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 shadow-md">
          ← Back to Students
        </button>
      </div>
    );
  }

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const totalScore = grades.reduce((s, g) => s + g.score, 0);
  const totalMax = grades.reduce((s, g) => s + g.maxScore, 0);
  const overallAvg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;

  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const paidFees = fees.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);

  const subjectMap: Record<string, number[]> = {};
  for (const g of grades) {
    const key = g.subjectName;
    if (!subjectMap[key]) subjectMap[key] = [];
    subjectMap[key].push(Math.round((g.score / g.maxScore) * 100));
  }
  const radarData = Object.entries(subjectMap).map(([subject, scores]) => ({
    subject,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  const termMap: Record<string, number[]> = { first: [], second: [], final: [] };
  for (const g of grades) {
    if (termMap[g.term]) termMap[g.term].push(Math.round((g.score / g.maxScore) * 100));
  }
  const termBarData = Object.entries(termMap)
    .filter(([, scores]) => scores.length > 0)
    .map(([term, scores]) => ({
      term: term === "first" ? t("firstTerm") : term === "second" ? t("secondTerm") : t("finalExam"),
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

  const gridStroke = isDark ? "#ffffff15" : "#e2e8f0";
  const axisColor = isDark ? "#9ca3af" : "#64748b";
  const tooltipStyle = isDark
    ? { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, color: "#fff" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#0f172a", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate("/dashboard/students")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white transition-all shadow-2xs"
        >
          ← {t("students")}
        </button>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className={`flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl text-xl sm:text-2xl font-bold text-white shadow-md ${student.gender === "male" ? "bg-gradient-to-tr from-blue-600 to-indigo-600" : "bg-gradient-to-tr from-pink-500 to-violet-600"}`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${student.gender === "male" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30" : "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/30"}`}>
                {student.gender === "male" ? t("male") : t("female")}
              </span>
              {overallAvg !== null && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {t("average")}: {overallAvg}%
                </span>
              )}
            </div>
            {student.nameEn && <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">{student.nameEn}</p>}

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">{t("class")}</p>
                <p className="text-gray-900 dark:text-white font-medium">{student.className}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">{t("dateOfBirth")}</p>
                <p className="text-gray-900 dark:text-white font-medium">{student.dateOfBirth || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">{t("guardian")}</p>
                <p className="text-gray-900 dark:text-white font-medium">{student.guardianName || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">{t("phone")}</p>
                <p className="text-gray-900 dark:text-white font-mono text-xs">{student.guardianPhone || "—"}</p>
              </div>
              {student.bloodGroup && (
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500">Blood Group</p>
                  <p className="text-gray-900 dark:text-white font-medium">{student.bloodGroup}</p>
                </div>
              )}
              {student.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] sm:text-xs text-gray-500">{t("notes")}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">{student.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-3.5 sm:p-4 text-center dark:border-indigo-500/30 dark:bg-indigo-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{overallAvg !== null ? `${overallAvg}%` : "—"}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("averageScore")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 sm:p-4 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{attendancePct}%</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("present")}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-3.5 sm:p-4 text-center dark:border-cyan-500/30 dark:bg-cyan-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{grades.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("grades")}</p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-violet-50/70 p-3.5 sm:p-4 text-center dark:border-violet-500/30 dark:bg-violet-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatIQD(paidFees)}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("paid")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-white/10">
        {(["grades", "attendance", "fees"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 font-bold dark:border-indigo-500 dark:text-white"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {t(tab === "grades" ? "grades" : tab === "attendance" ? "attendance" : "fees")}
          </button>
        ))}
      </div>

      {/* Grades Tab */}
      {activeTab === "grades" && (
        <div className="space-y-6">
          {grades.length === 0 ? (
            <p className="py-16 text-center text-gray-400 text-sm">{t("noData")}</p>
          ) : (
            <>
              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar chart by subject */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">{t("gradesBySubject")}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={gridStroke} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: axisColor, fontSize: 10 }} />
                      <Radar name="Avg" dataKey="avg" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string | readonly (number | string)[] | undefined) => `${v ?? ""}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar chart by term */}
                {termBarData.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">{t("averageScore")} {lang === "ar" ? "حسب الفصل" : "by Term"}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={termBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="term" tick={{ fill: axisColor, fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 10 }} unit="%" />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string | readonly (number | string)[] | undefined) => `${v ?? ""}%`} />
                        <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Grades table */}
              <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto shadow-sm dark:border-white/10 dark:bg-white/5">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("subjects")}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("term")}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("score")}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("percentage")}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("letterGrade")}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("result")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {grades.map((g) => {
                      const pct = Math.round((g.score / g.maxScore) * 100);
                      const { letter, color } = letterGrade(g.score, g.maxScore);
                      const pass = pct >= 50;
                      return (
                        <tr key={g.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{g.subjectName}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{g.term === "first" ? t("firstTerm") : g.term === "second" ? t("secondTerm") : t("finalExam")}</td>
                          <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{g.score}/{g.maxScore}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{pct}%</td>
                          <td className={`px-4 py-3 font-bold ${color}`}>{letter}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${pass ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"}`}>
                              {pass ? t("pass") : t("fail")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: t("present"), count: presentCount, color: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400" },
              { label: t("absent"),  count: absentCount,  color: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400" },
              { label: t("late"),    count: lateCount,     color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400" },
              { label: t("excused"), count: attendance.length - presentCount - absentCount - lateCount, color: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-2xl border p-3.5 sm:p-4 text-center shadow-xs ${color}`}>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto shadow-sm dark:border-white/10 dark:bg-white/5">
            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("selectDate")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("paymentStatus")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {attendance.length === 0 ? (
                  <tr><td colSpan={3} className="py-10 text-center text-gray-400">{t("noData")}</td></tr>
                ) : attendance.slice(0, 50).map((a) => {
                  const statusColors: Record<string, string> = {
                    present: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
                    absent: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
                    late: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30",
                    excused: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
                  };
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs sm:text-sm text-gray-700 dark:text-gray-300">{a.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColors[a.status]}`}>
                          {t(a.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{a.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === "fees" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-semibold">{t("totalCollected")}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatIQD(paidFees)}</p>
            </div>
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 shadow-xs dark:border-rose-500/30 dark:bg-rose-500/10">
              <p className="text-xs text-rose-700 dark:text-rose-400 uppercase tracking-wider font-semibold">{t("outstanding")}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatIQD(totalFees - paidFees)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto shadow-sm dark:border-white/10 dark:bg-white/5">
            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("feeType")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("amount")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("dueDate")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("paymentStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {fees.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-gray-400">{t("noData")}</td></tr>
                ) : fees.map((f) => {
                  const statusColors: Record<string, string> = {
                    paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
                    unpaid: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
                    partial: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30",
                  };
                  return (
                    <tr key={f.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t(f.type)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">{formatIQD(f.amount)}</td>
                      <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400 text-xs">{f.dueDate || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColors[f.status]}`}>
                          {t(f.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
