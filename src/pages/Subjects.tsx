import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  orderBy,
} from "@/lib/firestore-helpers";
import type { Subject } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Subjects() {
  const { schoolId } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await fetchCollection<Subject>(schoolId, "subjects", [orderBy("name")]);
      setSubjects(data);
    } catch (err) {
      console.error("Error loading subjects:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setName(""); setNameEn(""); setModalOpen(true); };
  const openEdit = (s: Subject) => { setEditing(s); setName(s.name); setNameEn(s.nameEn); setModalOpen(true); };

  const handleSave = async () => {
    if (!schoolId || !name) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDocument(schoolId, "subjects", editing.id, { name, nameEn });
      } else {
        await addDocument(schoolId, "subjects", { name, nameEn });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error("Error saving subject:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Subject) => {
    if (!schoolId || !confirm(`Delete subject "${s.name}"?`)) return;
    try {
      await deleteDocument(schoolId, "subjects", s.id);
      await load();
    } catch (err) {
      console.error("Error deleting subject:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Subjects</h2>
          <p className="text-sm text-gray-400">School Course Catalog</p>
        </div>
        <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
          + Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-500 col-span-3">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p className="text-gray-600 col-span-3 py-10 text-center">No subjects found. Click "+ Add Subject".</p>
        ) : subjects.map((s) => (
          <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between group hover:border-indigo-500/40 transition-colors">
            <div>
              <p className="font-semibold text-white">{s.name}</p>
              {s.nameEn && <p className="text-xs text-gray-500">{s.nameEn}</p>}
            </div>
            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(s)} className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
              <button onClick={() => handleDelete(s)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Shadcn Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Subject Name *</label>
              <input placeholder="Mathematics" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Subject Code / Code Name</label>
              <input placeholder="MATH-101" value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={saving || !name}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all">
                {saving ? "Saving..." : "Save Subject"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
