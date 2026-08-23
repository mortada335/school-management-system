import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
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
import RoleGuard from "@/components/RoleGuard";

export default function Subjects() {
  const { schoolId } = useAuth();
  const { t } = useTranslation();
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

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => { setEditing(null); setName(""); setNameEn(""); setModalOpen(true); };
  const openEdit = (s: Subject) => { setEditing(s); setName(s.name); setNameEn(s.nameEn || ""); setModalOpen(true); };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("subjects")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">School Course Catalog ({subjects.length})</p>
        </div>
        <RoleGuard permission="manage:classes">
          <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto">
            + {t("addSubject") || "Add Subject"}
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400 col-span-3 py-10 text-center text-sm">{t("loading")}</p>
        ) : subjects.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 col-span-3 py-16 text-center text-gray-500 dark:text-gray-400 text-sm">
            No subjects found. Click "+ Add Subject".
          </div>
        ) : subjects.map((s) => (
          <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 flex items-center justify-between group hover:border-indigo-500/40 hover:shadow-md transition-all dark:border-white/10 dark:bg-white/5 shadow-xs">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{s.name}</p>
              {s.nameEn && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.nameEn}</p>}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <RoleGuard permission="manage:classes">
                <button
                  onClick={() => openEdit(s)}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all active:scale-95"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {t("edit")}
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {t("delete")}
                </button>
              </RoleGuard>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name (Arabic) *</label>
              <input placeholder="الرياضيات" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name (English) / Code</label>
              <input placeholder="Mathematics / MATH-101" value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t("cancel")}</button>
              <button onClick={handleSave} disabled={saving || !name}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs">
                {saving ? t("saving") : t("saveClass") || "Save"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
