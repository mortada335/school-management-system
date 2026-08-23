import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useTranslation } from "@/lib/i18n";
import {
  fetchCollection,
  batchSetDocuments,
  where,
  orderBy,
} from "@/lib/firestore-helpers";
import type { AttendanceRecord, AttendanceStatus, Student, Class } from "@/types";
import { Combobox } from "@/components/ui/combobox";
import ExcelExport from "@/components/ExcelExport";
import RoleGuard from "@/components/RoleGuard";
import DataWrapper from "@/components/ui/DataWrapper";
import { SkeletonCard, SkeletonTableRow } from "@/components/ui/Skeleton";


export default function Attendance() {
  const { schoolId, user } = useAuth();
  const { activeYear } = useAcademicYear();
  const { t } = useTranslation();

  const STATUS_OPTIONS = useMemo(() => [
    { value: "present" as AttendanceStatus, label: t("present"), icon: "✅", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" },
    { value: "absent"  as AttendanceStatus, label: t("absent"),  icon: "❌", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30" },
    { value: "late"    as AttendanceStatus, label: t("late"),    icon: "🕐", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30" },
    { value: "excused" as AttendanceStatus, label: t("excused"), icon: "📋", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30" },
  ], [t]);

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [histClass, setHistClass] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    fetchCollection<Class>(schoolId, "classes", [
      where("academicYear", "==", activeYear),
      orderBy("grade"),
    ]).then(setClasses);
  }, [schoolId, activeYear]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!schoolId || !selectedClass || !selectedDate) return;
      setLoading(true);
      setSaved(false);

      try {
        const [studs, existing] = await Promise.all([
          fetchCollection<Student>(schoolId, "students", [
            where("classId", "==", selectedClass),
            orderBy("name"),
          ]),
          fetchCollection<AttendanceRecord>(schoolId, "attendance", [
            where("classId", "==", selectedClass),
            where("date", "==", selectedDate),
            where("academicYear", "==", activeYear),
          ]),
        ]);
        if (!active) return;
        setStudents(studs);
        const am: Record<string, AttendanceStatus> = {};
        const nm: Record<string, string> = {};
        studs.forEach((s) => { am[s.id] = "present"; nm[s.id] = ""; });
        existing.forEach((r) => { am[r.studentId] = r.status; nm[r.studentId] = r.notes || ""; });
        setAttendanceMap(am);
        setNotesMap(nm);
      } catch (err) {
        console.error("Error loading attendance:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [schoolId, selectedClass, selectedDate, activeYear]);

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { newMap[s.id] = status; });
    setAttendanceMap(newMap);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!schoolId || !selectedClass || !selectedDate || students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        id: `${s.id}_${selectedDate}`,
        data: {
          studentId: s.id,
          studentName: s.name,
          classId: selectedClass,
          date: selectedDate,
          status: attendanceMap[s.id] ?? "present",
          notes: notesMap[s.id] ?? "",
          recordedBy: user?.uid ?? "",
          academicYear: activeYear,
        },
      }));
      await batchSetDocuments(schoolId, "attendance", records);
      setSaved(true);
    } catch (err) {
      console.error("Error saving attendance:", err);
    } finally {
      setSaving(false);
    }
  };

  // Load history
  const loadHistory = useCallback(async () => {
    if (!schoolId || !histClass) return;
    setHistoryLoading(true);
    try {
      const recs = await fetchCollection<AttendanceRecord>(schoolId, "attendance", [
        where("classId", "==", histClass),
        where("academicYear", "==", activeYear),
        orderBy("date", "desc"),
      ]);
      setHistory(recs);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [schoolId, histClass, activeYear]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const classOptions = classes.map((c) => ({ value: c.id, label: c.name, sublabel: c.nameEn }));

  const presentCount = students.filter((s) => attendanceMap[s.id] === "present").length;
  const absentCount = students.filter((s) => attendanceMap[s.id] === "absent").length;
  const lateCount = students.filter((s) => attendanceMap[s.id] === "late").length;

  const excelData = students.map((s) => ({
    [t("name")]: s.name,
    [t("paymentStatus")]: attendanceMap[s.id] ?? "present",
    [t("notes")]: notesMap[s.id] ?? "",
    [t("selectDate")]: selectedDate,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("attendance")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("dailyRegister")} — {activeYear}</p>
        </div>
        <ExcelExport data={excelData} filename="attendance" label={t("exportRegister")} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-white/10">
        {(["today", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 font-bold dark:border-indigo-500 dark:text-white"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {tab === "today" ? `📝 ${t("todayRegister")}` : `📅 ${t("attendanceHistory")}`}
          </button>
        ))}
      </div>

      {activeTab === "today" ? (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="flex-1 min-w-44">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("class")}</label>
              <Combobox
                value={selectedClass}
                onChange={(val) => { setSelectedClass(val); setSaved(false); }}
                placeholder={t("selectClass")}
                options={classOptions}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("selectDate")}</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSaved(false); }}
                className="w-full sm:w-auto rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white shadow-2xs"
              />
            </div>
          </div>

          {!selectedClass ? (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 py-20 text-center text-gray-400 text-sm">
              {t("selectClassFirst")}
            </div>
          ) : (
            <DataWrapper
              loading={loading}
              empty={students.length === 0}
              emptyMessage={String(t("noStudentsInClass"))}
              skeleton={
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} className="h-16" />
                  ))}
                </div>
              }
            >
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 sm:p-4 text-center shadow-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{presentCount}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-semibold">{t("present")}</p>
                </div>
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3.5 sm:p-4 text-center shadow-xs dark:border-rose-500/30 dark:bg-rose-500/10">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{absentCount}</p>
                  <p className="text-[10px] sm:text-xs text-rose-700 dark:text-rose-400 mt-0.5 font-semibold">{t("absent")}</p>
                </div>
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 sm:p-4 text-center shadow-xs dark:border-yellow-500/30 dark:bg-yellow-500/10">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{lateCount}</p>
                  <p className="text-[10px] sm:text-xs text-amber-700 dark:text-yellow-400 mt-0.5 font-semibold">{t("late")}</p>
                </div>
              </div>

              {/* Bulk actions */}
              <RoleGuard permission="record:attendance">
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 self-center me-1">{t("markAllPresent")}:</span>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleMarkAll(opt.value)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shadow-2xs ${opt.color}`}
                    >
                      {opt.icon} All {opt.label}
                    </button>
                  ))}
                </div>
              </RoleGuard>

              {/* Student list */}
              <div className="space-y-2.5">
                {students.map((s, i) => {
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-white/10 dark:bg-white/5 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-mono text-gray-400">{i + 1}</span>
                          <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{s.name}</p>
                        </div>
                        {/* Status toggle buttons */}
                        <RoleGuard permission="record:attendance">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => { setAttendanceMap((p) => ({ ...p, [s.id]: opt.value })); setSaved(false); }}
                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95 ${attendanceMap[s.id] === opt.value ? opt.color : "border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white"}`}
                              >
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                            <input
                              placeholder={t("notes")}
                              value={notesMap[s.id] ?? ""}
                              onChange={(e) => setNotesMap((p) => ({ ...p, [s.id]: e.target.value }))}
                              className="w-full sm:w-36 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-900 outline-none placeholder:text-gray-400 dark:border-white/10 dark:bg-black/20 dark:text-gray-300 dark:placeholder:text-gray-600"
                            />
                          </div>
                        </RoleGuard>
                      </div>
                    </div>
                  );
                })}
              </div>

              <RoleGuard permission="record:attendance">
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
                  >
                    {saving ? t("saving") : t("saveAttendance")}
                  </button>
                  {saved && <span className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium">{t("savedSuccessfully")}</span>}
                </div>
              </RoleGuard>
            </DataWrapper>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("class")}</label>
            <Combobox
              value={histClass}
              onChange={setHistClass}
              placeholder={t("selectClass")}
              options={classOptions}
            />
          </div>

          <DataWrapper
            loading={historyLoading}
            empty={history.length === 0}
            emptyMessage={String(t("noData"))}
            skeleton={
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-white/10 dark:bg-white/5">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonTableRow key={i} cols={4} />
                    ))}
                  </tbody>
                </table>
              </div>
            }
          >
            <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto shadow-sm dark:border-white/10 dark:bg-white/5">
              <table className="w-full text-xs sm:text-sm min-w-[600px]">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("selectDate")}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("name")}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("paymentStatus")}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {history.map((r) => {
                    const opt = STATUS_OPTIONS.find((o) => o.value === r.status) ?? STATUS_OPTIONS[0];
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{r.date}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.studentName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${opt.color}`}>
                            {opt.icon} {opt.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DataWrapper>
        </div>
      )}
    </div>
  );
}
