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
import type { Student, Class } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";

const emptyForm = () => ({
  name: "",
  nameEn: "",
  classId: "",
  gender: "male" as "male" | "female",
  dateOfBirth: "",
  guardianName: "",
  guardianPhone: "",
});

export default function Students() {
  const { schoolId } = useAuth();
  const { activeYear } = useAcademicYear();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [studs, cls] = await Promise.all([
        fetchCollection<Student>(schoolId, "students", [
          where("enrollmentYear", "==", activeYear),
          orderBy("name"),
        ]),
        fetchCollection<Class>(schoolId, "classes", [
          where("academicYear", "==", activeYear),
          orderBy("grade"),
        ]),
      ]);
      setStudents(studs);
      setClasses(cls);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      nameEn: s.nameEn,
      classId: s.classId,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !form.name || !form.classId) return;
    setSaving(true);
    try {
      const cls = classes.find((c) => c.id === form.classId);
      const data = {
        ...form,
        className: cls?.name ?? "",
        enrollmentYear: activeYear,
      };
      if (editing) {
        await updateDocument(schoolId, "students", editing.id, data);
      } else {
        await addDocument(schoolId, "students", data);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error("Error saving student:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Student) => {
    if (!schoolId || !confirm(`Delete student "${s.name}"?`)) return;
    try {
      await deleteDocument(schoolId, "students", s.id);
      await load();
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch = s.name.includes(search) || s.nameEn.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "all" || s.classId === filterClass;
    return matchSearch && matchClass;
  });

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.nameEn,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Students</h2>
          <p className="text-sm text-gray-400">Enrolled Students — {activeYear} ({students.length} total)</p>
        </div>
        <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
          + Add Student
        </button>
      </div>

      <div className="flex gap-3">
        <input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500"
        />
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              {["Name", "Class", "Gender", "Guardian", "Phone", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-500">Loading students...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-600">No students found. Click "+ Add Student".</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{s.name}</p>
                  {s.nameEn && <p className="text-xs text-gray-500">{s.nameEn}</p>}
                </td>
                <td className="px-4 py-3 text-gray-400">{s.className}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${s.gender === "male" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-pink-500/20 text-pink-400 border-pink-500/30"}`}>
                    {s.gender === "male" ? "Male" : "Female"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{s.guardianName}</td>
                <td className="px-4 py-3 text-gray-400">{s.guardianPhone}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(s)} className="text-indigo-400 hover:text-indigo-300 mr-4 text-xs">Edit</button>
                  <button onClick={() => handleDelete(s)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
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
            <DialogTitle>{editing ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
                <input placeholder="Mohammed Ali Hassan" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Secondary / Code Name</label>
                <input placeholder="M. Hassan" value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Class *</label>
                <Combobox
                  value={form.classId}
                  onChange={(val) => setForm({ ...form, classId: val })}
                  placeholder="Search class..."
                  options={classOptions}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Guardian Name</label>
                <input placeholder="Ali Hassan Mohammed" value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Guardian Phone</label>
                <input placeholder="07xx-xxx-xxxx" value={form.guardianPhone}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.classId}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all">
                {saving ? "Saving..." : "Save Student"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
