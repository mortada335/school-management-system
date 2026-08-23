import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useTranslation } from "@/lib/i18n";
import {
  fetchCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  orderBy,
  where,
  countDocuments,
} from "@/lib/firestore-helpers";
import type { Class, Teacher } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import RoleGuard from "@/components/RoleGuard";

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const SECTIONS = ["A", "B", "C", "D", "E", "F"];

const GRADE_COLORS = [
  "bg-indigo-50/80 border-indigo-200/80 text-indigo-950 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-indigo-600/10 dark:border-indigo-500/30 dark:text-white",
  "bg-violet-50/80 border-violet-200/80 text-violet-950 dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-violet-600/10 dark:border-violet-500/30 dark:text-white",
  "bg-cyan-50/80 border-cyan-200/80 text-cyan-950 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-cyan-600/10 dark:border-cyan-500/30 dark:text-white",
  "bg-emerald-50/80 border-emerald-200/80 text-emerald-950 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-emerald-600/10 dark:border-emerald-500/30 dark:text-white",
  "bg-amber-50/80 border-amber-200/80 text-amber-950 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-amber-600/10 dark:border-amber-500/30 dark:text-white",
  "bg-rose-50/80 border-rose-200/80 text-rose-950 dark:bg-gradient-to-br dark:from-rose-500/20 dark:to-rose-600/10 dark:border-rose-500/30 dark:text-white",
];

const emptyForm = () => ({
  name: "",
  grade: 1,
  section: "A",
  teacherId: "",
  capacity: 35,
  room: "",
  schedule: "morning" as "morning" | "afternoon",
});

export default function Classes() {
  const { schoolId } = useAuth();
  const { activeYear } = useAcademicYear();
  const { t, lang } = useTranslation();

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const cls = await fetchCollection<Class>(schoolId, "classes", [
        where("academicYear", "==", activeYear),
        orderBy("grade"),
      ]);
      setClasses(cls);

      const tch = await fetchCollection<Teacher>(schoolId, "teachers", [
        orderBy("name"),
      ]);
      setTeachers(tch);

      const counts: Record<string, number> = {};
      await Promise.all(
        cls.map(async (c) => {
          counts[c.id] = await countDocuments(schoolId, "students", [
            where("classId", "==", c.id),
            where("enrollmentYear", "==", activeYear),
          ]);
        })
      );
      setStudentCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };
  const openEdit = (c: Class) => {
    setEditing(c);
    setForm({
      name: c.name,
      grade: c.grade,
      section: c.section,
      teacherId: c.teacherId,
      capacity: c.capacity ?? 35,
      room: c.room ?? "",
      schedule: c.schedule ?? "morning",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !form.name) return;
    setSaving(true);
    try {
      const teacher = teachers.find((t) => t.id === form.teacherId);
      const data = {
        ...form,
        nameEn: `Grade ${form.grade} - Section ${form.section}`,
        teacherName: teacher?.name ?? "",
        academicYear: activeYear,
      };
      if (editing) {
        await updateDocument(schoolId, "classes", editing.id, data);
      } else {
        await addDocument(schoolId, "classes", data);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Class) => {
    if (!schoolId || !confirm(`Delete class "${c.name}"?`)) return;
    try {
      await deleteDocument(schoolId, "classes", c.id);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: t.name,
    sublabel: t.nameEn,
  }));

  const gradeGroups: Record<number, Class[]> = {};
  for (const c of classes) {
    if (!gradeGroups[c.grade]) gradeGroups[c.grade] = [];
    gradeGroups[c.grade].push(c);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("classes")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("academicYear")}: {activeYear} — {classes.length} {lang === "ar" ? "صف" : "classes"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-2xs">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === "card" ? "bg-indigo-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
            >
              ⊞ {t("cardView")}
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === "table" ? "bg-indigo-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
            >
              ≡ {t("tableView")}
            </button>
          </div>
          <RoleGuard permission="manage:classes">
            <button
              onClick={openAdd}
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all"
            >
              + {t("addClass")}
            </button>
          </RoleGuard>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">{t("loading")}</div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 py-20 text-center text-gray-500 dark:text-gray-400">{t("noClassesFound")}</div>
      ) : viewMode === "card" ? (
        <div className="space-y-6">
          {Object.entries(gradeGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, gradeClasses], gi) => (
            <div key={grade}>
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                {t("grade")} {grade}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradeClasses.map((c) => {
                  const count = studentCounts[c.id] ?? 0;
                  const cap = c.capacity ?? 35;
                  const fillPct = Math.min(100, Math.round((count / cap) * 100));
                  const colorClass = GRADE_COLORS[gi % GRADE_COLORS.length];
                  return (
                    <div key={c.id} className={`rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all ${colorClass}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{c.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.nameEn}</p>
                        </div>
                        <div className="text-xl sm:text-2xl">{c.grade <= 6 ? "📚" : "🎓"}</div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>👩‍🏫 {c.teacherName || "—"}</span>
                          <span>🚪 {c.room || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{t("studentCount")}: <span className="font-semibold text-gray-900 dark:text-white">{count}</span>/{cap}</span>
                          <span className="text-gray-600 dark:text-gray-400">{fillPct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-black/10 dark:bg-black/20 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600 dark:bg-white/40 transition-all"
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <RoleGuard permission="manage:classes">
                          <button
                            onClick={() => openEdit(c)}
                            className="flex-1 rounded-lg bg-white/80 dark:bg-white/10 px-2 py-1.5 text-xs font-medium text-gray-800 dark:text-white border border-black/5 dark:border-transparent hover:bg-white dark:hover:bg-white/20 transition-all shadow-2xs"
                          >
                            ✏️ {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="rounded-lg bg-rose-500/10 px-2 py-1.5 text-xs font-medium text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 transition-all"
                          >
                            🗑
                          </button>
                        </RoleGuard>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto shadow-sm dark:border-white/10 dark:bg-white/5">
          <table className="w-full text-xs sm:text-sm text-left min-w-[600px]">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/60">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("className")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("grade")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("section")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("homeroomTeacher")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("studentCount")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("room")}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{t("grade")} {c.grade}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{c.section}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.teacherName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900 dark:text-white">{studentCounts[c.id] ?? "..."}</span>
                    <span className="text-gray-400 text-xs">/{c.capacity ?? 35}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{c.room || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <RoleGuard permission="manage:classes">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all"
                        >
                          ✏️ {t("edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all"
                        >
                          🗑 {t("delete")}
                        </button>
                      </RoleGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("editClass") : t("addClass")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("className")} *</label>
              <input
                placeholder="الصف السابع - شعبة أ"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("grade")}</label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  {GRADES.map((g) => <option key={g} value={g}>{t("grade")} {g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("section")}</label>
                <select
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  {SECTIONS.map((s) => <option key={s} value={s}>{t("section")} {s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("capacity")}</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("room")}</label>
                <input
                  placeholder="101"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("homeroomTeacher")}</label>
              <Combobox
                value={form.teacherId}
                onChange={(val) => setForm({ ...form, teacherId: val })}
                placeholder={t("searchTeachers")}
                options={teacherOptions}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t("cancel")}</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs"
              >
                {saving ? t("saving") : t("saveClass")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
