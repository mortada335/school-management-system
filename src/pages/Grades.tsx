import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useTranslation } from "@/lib/i18n";
import {
  fetchCollection,
  batchSetDocuments,
  where,
  orderBy,
} from "@/lib/firestore-helpers";
import type { Student, Class, Subject, Grade, GradeTerm } from "@/types";
import { Combobox } from "@/components/ui/combobox";
import ExcelExport from "@/components/ExcelExport";
import RoleGuard from "@/components/RoleGuard";
import DataWrapper from "@/components/ui/DataWrapper";
import { SkeletonCard, SkeletonTableRow } from "@/components/ui/Skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";


const PASS_THRESHOLD = 0.5;

function letterGrade(score: number, max: number): { letter: string; color: string } {
  const pct = (score / max) * 100;
  if (pct >= 90) return { letter: "A+", color: "text-emerald-600 dark:text-emerald-400" };
  if (pct >= 80) return { letter: "A",  color: "text-emerald-600 dark:text-emerald-400" };
  if (pct >= 70) return { letter: "B",  color: "text-blue-600 dark:text-blue-400" };
  if (pct >= 60) return { letter: "C",  color: "text-amber-600 dark:text-yellow-400" };
  if (pct >= 50) return { letter: "D",  color: "text-orange-600 dark:text-orange-400" };
  return { letter: "F", color: "text-rose-600 dark:text-rose-400" };
}

export default function Grades() {
  const { schoolId, user } = useAuth();
  const { isDark } = useTheme();
  const { activeYear } = useAcademicYear();
  const { t } = useTranslation();

  const TERMS = useMemo(() => [
    { value: "first"  as GradeTerm, label: t("firstTerm") },
    { value: "second" as GradeTerm, label: t("secondTerm") },
    { value: "final"  as GradeTerm, label: t("finalExam") },
  ], [t]);

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<GradeTerm>("first");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [maxScore] = useState(100);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      fetchCollection<Class>(schoolId, "classes", [where("academicYear", "==", activeYear), orderBy("grade")]),
      fetchCollection<Subject>(schoolId, "subjects", [orderBy("name")]),
    ]).then(([cls, sub]) => { setClasses(cls); setSubjects(sub); });
  }, [schoolId, activeYear]);

  const loadGrades = useCallback(async () => {
    if (!schoolId || !selectedClass || !selectedSubject) return;
    setLoadingStudents(true);
    setSaved(false);

    try {
      const [studs, existingGrades] = await Promise.all([
        fetchCollection<Student>(schoolId, "students", [
          where("classId", "==", selectedClass),
        ]),
        fetchCollection<Grade>(schoolId, "grades", [
          where("classId", "==", selectedClass),
          where("subjectId", "==", selectedSubject),
          where("term", "==", selectedTerm),
          where("academicYear", "==", activeYear),
        ]),
      ]);

      // Sort client-side — avoids requiring a composite Firestore index
      studs.sort((a, b) => a.name.localeCompare(b.name));

      setStudents(studs);
      const existing: Record<string, string> = {};
      existingGrades.forEach((g) => { existing[g.studentId] = String(g.score); });
      const defaults: Record<string, string> = {};
      studs.forEach((s) => { defaults[s.id] = existing[s.id] ?? ""; });
      setScores(defaults);
    } catch (err) {
      console.error("Error loading grades:", err);
    } finally {
      setLoadingStudents(false);
    }
  }, [schoolId, selectedClass, selectedSubject, selectedTerm, activeYear]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const handleSave = async () => {
    if (!schoolId || !selectedClass || !selectedSubject || students.length === 0) return;
    setSaving(true);
    try {
      const subject = subjects.find((s) => s.id === selectedSubject);
      const records = students
        .filter((s) => scores[s.id] !== "")
        .map((s) => ({
          id: `${s.id}_${selectedSubject}_${selectedTerm}_${activeYear}`,
          data: {
            studentId: s.id,
            studentName: s.name,
            subjectId: selectedSubject,
            subjectName: subject?.name ?? "",
            classId: selectedClass,
            term: selectedTerm,
            score: Number(scores[s.id]) || 0,
            maxScore,
            academicYear: activeYear,
            recordedBy: user?.uid ?? "",
          },
        }));
      await batchSetDocuments(schoolId, "grades", records);
      setSaved(true);
    } catch (err) {
      console.error("Error saving grades:", err);
    } finally {
      setSaving(false);
    }
  };

  const getPercent = (score: string) => {
    const n = Number(score);
    if (!score || isNaN(n)) return null;
    return Math.round((n / maxScore) * 100);
  };

  const ready = selectedClass && selectedSubject;

  // Class statistics
  const validScores = students
    .filter((s) => scores[s.id] !== "" && !isNaN(Number(scores[s.id])))
    .map((s) => Number(scores[s.id]));

  const classAvg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
  const classMax = validScores.length ? Math.max(...validScores) : null;
  const classMin = validScores.length ? Math.min(...validScores) : null;
  const passCount = validScores.filter((s) => s / maxScore >= PASS_THRESHOLD).length;

  // Score distribution
  const distBuckets = [
    { label: "0-49", count: validScores.filter((s) => s < 50).length, color: "#ef4444" },
    { label: "50-69", count: validScores.filter((s) => s >= 50 && s < 70).length, color: "#f59e0b" },
    { label: "70-89", count: validScores.filter((s) => s >= 70 && s < 90).length, color: "#6366f1" },
    { label: "90-100", count: validScores.filter((s) => s >= 90).length, color: "#10b981" },
  ];

  // Sorted students for top-3 highlighting
  const sortedStudentIds = [...students]
    .filter((s) => scores[s.id] !== "" && !isNaN(Number(scores[s.id])))
    .sort((a, b) => Number(scores[b.id]) - Number(scores[a.id]))
    .map((s) => s.id);

  const classOptions = classes.map((c) => ({ value: c.id, label: c.name, sublabel: c.nameEn }));
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name, sublabel: s.nameEn }));

  const excelData = students.map((s, i) => {
    const pct = getPercent(scores[s.id] ?? "");
    const { letter } = letterGrade(Number(scores[s.id]) || 0, maxScore);
    return {
      "#": i + 1,
      [t("name")]: s.name,
      [t("score")]: scores[s.id] || "—",
      [t("percentage")]: pct !== null ? `${pct}%` : "—",
      [t("letterGrade")]: scores[s.id] ? letter : "—",
      [t("result")]: pct !== null ? (pct >= 50 ? t("pass") : t("fail")) : "—",
    };
  });

  const gridStroke = isDark ? "#ffffff15" : "#e2e8f0";
  const axisColor = isDark ? "#9ca3af" : "#64748b";
  const tooltipStyle = isDark
    ? { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, color: "#fff" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#0f172a", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("grades")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("gradesResults")} — {activeYear}</p>
        </div>
        <ExcelExport data={excelData} filename="grades" label={t("exportGrades")} />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("class")}</label>
          <Combobox
            value={selectedClass}
            onChange={setSelectedClass}
            placeholder={t("selectClass")}
            options={classOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("subjects")}</label>
          <Combobox
            value={selectedSubject}
            onChange={setSelectedSubject}
            placeholder={t("selectClass")}
            options={subjectOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("term")}</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value as GradeTerm)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white shadow-2xs"
          >
            {TERMS.map((term) => <option key={term.value} value={term.value}>{t(term.value === "first" ? "firstTerm" : term.value === "second" ? "secondTerm" : "finalExam") || term.label}</option>)}
          </select>
        </div>
      </div>

      {!ready ? (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 py-20 text-center text-gray-400 text-sm">
          {t("selectClassAndSubject")}
        </div>
      ) : (
        <DataWrapper
          loading={loadingStudents}
          empty={students.length === 0}
          emptyMessage={String(t("noStudentsInClass"))}
          skeleton={
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} className="h-20" />
                ))}
              </div>
              <SkeletonCard className="h-40" />
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-white/10 dark:bg-white/5">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonTableRow key={i} cols={6} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          }
        >
          {/* Class Statistics */}
          {validScores.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: t("average"),  value: classAvg !== null ? `${Math.round((classAvg / maxScore) * 100)}%` : "—", color: "border-indigo-200/80 bg-indigo-50/70 text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-500/10" },
                { label: t("highest"), value: classMax !== null ? `${classMax}/${maxScore}` : "—", color: "border-emerald-200/80 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10" },
                { label: t("lowest"),  value: classMin !== null ? `${classMin}/${maxScore}` : "—", color: "border-rose-200/80 bg-rose-50/70 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10" },
                { label: t("pass"),    value: `${passCount}/${validScores.length}`, color: "border-cyan-200/80 bg-cyan-50/70 text-cyan-950 dark:border-cyan-500/30 dark:bg-cyan-500/10" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-2xl border p-3.5 sm:p-4 text-center shadow-xs ${color}`}>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Score Distribution Chart */}
          {validScores.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={distBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distBuckets.map((b) => <Cell key={b.label} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Grades Table */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto shadow-sm dark:border-white/10 dark:bg-white/5">
            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("student")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("score")} / {maxScore}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("percentage")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("letterGrade")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("result")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {students.map((s, i) => {
                  const pct = getPercent(scores[s.id] ?? "");
                  const pass = pct !== null && pct >= PASS_THRESHOLD * 100;
                  const { letter, color } = letterGrade(Number(scores[s.id]) || 0, maxScore);
                  const rank = sortedStudentIds.indexOf(s.id);
                  const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : null;
                  const isFail = pct !== null && pct < 50;
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50/80 dark:hover:bg-white/5 ${isFail && scores[s.id] !== "" ? "bg-rose-50/50 dark:bg-rose-500/5" : ""}`}>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {medal ?? (i + 1)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {s.name}
                        {medal && <span className="ml-2 text-xs text-amber-500 dark:text-yellow-400 font-normal">Top {rank + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <RoleGuard permission="record:grades">
                          <input
                            type="number"
                            min={0}
                            max={maxScore}
                            placeholder="—"
                            value={scores[s.id] ?? ""}
                            onChange={(e) => { setScores((p) => ({ ...p, [s.id]: e.target.value })); setSaved(false); }}
                            className="w-20 sm:w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs sm:text-sm text-gray-900 font-mono outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          />
                        </RoleGuard>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs sm:text-sm">{pct !== null ? `${pct}%` : "—"}</td>
                      <td className={`px-4 py-3 font-bold ${scores[s.id] ? color : "text-gray-400 dark:text-gray-600"}`}>
                        {scores[s.id] ? letter : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {pct !== null && (
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${pass ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"}`}>
                            {pass ? t("pass") : t("fail")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <RoleGuard permission="record:grades">
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
              >
                {saving ? t("saving") : t("saveGrades")}
              </button>
              {saved && <span className="text-emerald-600 dark:text-green-400 text-xs sm:text-sm font-medium">{t("gradesSaved")}</span>}
            </div>
          </RoleGuard>
        </DataWrapper>
      )}
    </div>
  );
}
