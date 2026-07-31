import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import {
  fetchCollection,
  addDocument,
  deleteDocument,
  orderBy,
  where,
} from "@/lib/firestore-helpers";
import type { Announcement, AnnouncementTarget } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TARGETS: { value: AnnouncementTarget; labelAr: string }[] = [
  { value: "all", labelAr: "الجميع (All)" },
  { value: "teacher", labelAr: "المعلمون فقط (Teachers Only)" },
  { value: "student", labelAr: "الطلاب وأولياء الأمور (Students/Parents)" },
];

const emptyForm = () => ({
  title: "",
  titleEn: "",
  body: "",
  bodyEn: "",
  targetRole: "all" as AnnouncementTarget,
});

export default function Announcements() {
  const { schoolId, profile, user } = useAuth();
  const { activeYear } = useAcademicYear();

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await fetchCollection<Announcement>(schoolId, "announcements", [
        where("academicYear", "==", activeYear),
        orderBy("createdAt", "desc"),
      ]);
      setItems(data);
    } catch (err) {
      console.error("Error loading announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !form.title || !form.body) return;
    setSaving(true);
    try {
      await addDocument(schoolId, "announcements", {
        ...form,
        createdBy: user?.uid ?? "",
        createdByName: profile?.displayName ?? user?.displayName ?? user?.email ?? "Admin",
        academicYear: activeYear,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error("Error creating announcement:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!schoolId || !confirm(`Delete announcement "${item.title}"?`)) return;
    try {
      await deleteDocument(schoolId, "announcements", item.id);
      await load();
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">الإعلانات والملاحظات</h2>
          <p className="text-sm text-gray-400">Announcements — {activeYear}</p>
        </div>
        <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
          + New Announcement
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading announcements...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-center text-gray-600">
          No announcements published for {activeYear}. Click "+ New Announcement".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => {
            const targetMeta = TARGETS.find((t) => t.value === item.targetRole);
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-400">
                      {targetMeta?.labelAr || item.targetRole}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white" dir="rtl">{item.title}</h3>
                    {item.titleEn && <p className="text-xs text-gray-400">{item.titleEn}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-4 text-sm text-gray-300 whitespace-pre-wrap" dir="rtl">
                  {item.body}
                </div>
                {item.bodyEn && (
                  <div className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">
                    {item.bodyEn}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-500">
                  <span>Posted by: {item.createdByName || "Admin"}</span>
                  <span>{item.createdAt ? new Date((item.createdAt as any).seconds * 1000).toLocaleDateString("ar-IQ") : "Just now"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shadcn Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement / إعلان جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Target Audience / الفئة المستهدفة</label>
              <select
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value as AnnouncementTarget })}
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
              >
                {TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>{t.labelAr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Title (Arabic) *</label>
              <input
                dir="rtl"
                placeholder="إعلان بشأن بداية الامتحانات الرسمية"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Title (English optional)</label>
              <input
                placeholder="Announcement Regarding Final Exams"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Body (Arabic) *</label>
              <textarea
                dir="rtl"
                rows={4}
                placeholder="تفاصيل الإعلان..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Body (English optional)</label>
              <textarea
                rows={3}
                placeholder="Announcement details in English..."
                value={form.bodyEn}
                onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.body}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
              >
                {saving ? "Publishing..." : "Publish Announcement"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
