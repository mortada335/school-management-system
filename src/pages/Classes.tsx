/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import {
  fetchCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  orderBy,
  where,
} from "@/lib/firestore-helpers";
import type { Class, Teacher } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const SECTIONS = ["A", "B", "C", "D", "E", "F"];

const emptyForm = () => ({
  name: "",
  grade: 1,
  section: "A",
  teacherId: "",
});

export default function Classes() {
  const { schoolId } = useAuth();
  const { activeYear } = useAcademicYear();

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [cls, tch] = await Promise.all([
        fetchCollection<Class>(schoolId, "classes", [
          where("academicYear", "==", activeYear),
          orderBy("grade"),
        ]),
        fetchCollection<Teacher>(schoolId, "teachers", [orderBy("name")]),
      ]);
      setClasses(cls);
      setTeachers(tch);
    } catch (err) {
      console.error("Error loading classes:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (c: Class) => {
    setEditing(c);
    setForm({ name: c.name, grade: c.grade, section: c.section, teacherId: c.teacherId });
    setModalOpen(true);
  };
  // console.log(schoolId)

  const handleSave = async () => {
    if (!schoolId || !form.name) return;
    setSaving(true);
    try {
      const teacher = teachers.find((t) => t.id === form.teacherId);
      const data = {
        name: form.name,
        nameEn: `Grade ${form.grade} - Section ${form.section}`,
        grade: form.grade,
        section: form.section,
        teacherId: form.teacherId,
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
      console.error("Error saving class:", err);
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
      console.error("Error deleting class:", err);
    }
  };

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: t.name,
    sublabel: t.nameEn,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Classes</h2>
          <p className="text-sm text-gray-400">Academic Year: {activeYear}</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
        >
          + Add Class
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              {["Class Name", "Grade", "Section", "Homeroom Teacher", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="py-16 text-center text-gray-500">Loading classes...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={5} className="py-16 text-center text-gray-600">No classes found. Click "+ Add Class".</td></tr>
            ) : classes.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 text-gray-400">Grade {c.grade}</td>
                <td className="px-4 py-3 text-gray-400">{c.section}</td>
                <td className="px-4 py-3 text-gray-400">{c.teacherName || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="text-indigo-400 hover:text-indigo-300 mr-4 text-xs">Edit</button>
                  <button onClick={() => handleDelete(c)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shadcn Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Class Name *</label>
              <input
                placeholder="Grade 7 - Section A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Grade</label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
                >
                  {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
                >
                  {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Homeroom Teacher (Searchable Combobox)</label>
              <Combobox
                value={form.teacherId}
                onChange={(val) => setForm({ ...form, teacherId: val })}
                placeholder="Search or select teacher..."
                options={teacherOptions}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save Class"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
