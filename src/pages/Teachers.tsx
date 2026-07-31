import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  orderBy,
} from "@/lib/firestore-helpers";
import type { Teacher } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const emptyForm = () => ({ name: "", nameEn: "", email: "", phone: "" });

export default function Teachers() {
  const { schoolId } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await fetchCollection<Teacher>(schoolId, "teachers", [orderBy("name")]);
      setTeachers(data);
    } catch (err) {
      console.error("Error loading teachers:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({ name: t.name, nameEn: t.nameEn, email: t.email, phone: t.phone });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !form.name) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDocument(schoolId, "teachers", editing.id, form);
      } else {
        await addDocument(schoolId, "teachers", { ...form, subjectIds: [], classIds: [] });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error("Error saving teacher:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Teacher) => {
    if (!schoolId || !confirm(`Delete teacher "${t.name}"?`)) return;
    try {
      await deleteDocument(schoolId, "teachers", t.id);
      await load();
    } catch (err) {
      console.error("Error deleting teacher:", err);
    }
  };

  const filtered = teachers.filter((t) =>
    t.name.includes(search) || t.nameEn.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Teachers</h2>
          <p className="text-sm text-gray-400">Faculty Members ({teachers.length})</p>
        </div>
        <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
          + Add Teacher
        </button>
      </div>

      <input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500"
      />

      {/* Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-xl">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-white/10 bg-gray-900/60 backdrop-blur">
            <tr>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Teacher</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Email</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Phone</th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="py-16 text-center text-gray-500">Loading teachers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-gray-600">No teachers found. Click "+ Add Teacher".</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{t.name}</p>
                      {t.nameEn && <p className="text-xs text-gray-500">{t.nameEn}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{t.email || "—"}</td>
                <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{t.phone || "—"}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(t)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all active:scale-95"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all active:scale-95"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  </div>
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
            <DialogTitle>{editing ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
              <input placeholder="Ahmed Ali Al-Karimi" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Secondary / Code Name</label>
              <input placeholder="A. Al-Karimi" value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
              <input type="email" placeholder="teacher@school.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Phone</label>
              <input placeholder="07xx-xxx-xxxx" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all">
                {saving ? "Saving..." : "Save Teacher"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
