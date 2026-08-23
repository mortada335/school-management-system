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
} from "@/lib/firestore-helpers";
import type { Announcement, AnnPriority, AnnouncementTarget } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RoleGuard from "@/components/RoleGuard";

const PRIORITY_META: Record<AnnPriority, { label: string; icon: string; color: string }> = {
  urgent: { label: "Urgent",  icon: "🔴", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30" },
  normal: { label: "Normal",  icon: "🟡", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30" },
  info:   { label: "Info",    icon: "🔵", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30" },
};

const TARGET_META: Record<AnnouncementTarget, { label: string; icon: string }> = {
  all:     { label: "Everyone",         icon: "👥" },
  teacher: { label: "Teachers Only",    icon: "👨‍🏫" },
  student: { label: "Students & Parents", icon: "👩‍🎓" },
};

const emptyForm = () => ({
  title: "",
  titleEn: "",
  body: "",
  bodyEn: "",
  targetRole: "all" as AnnouncementTarget,
  priority: "normal" as AnnPriority,
  pinned: false,
  expiresAt: "",
});

export default function Announcements() {
  const { schoolId, user, profile } = useAuth();
  const { activeYear } = useAcademicYear();
  const { t } = useTranslation();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await fetchCollection<Announcement>(schoolId, "announcements", [
        where("academicYear", "==", activeYear),
        orderBy("createdAt", "desc"),
      ]);
      setAnnouncements(data);
    } catch (err) {
      console.error("Error loading announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (ann: Announcement) => {
    setEditing(ann);
    setForm({
      title: ann.title,
      titleEn: ann.titleEn,
      body: ann.body,
      bodyEn: ann.bodyEn,
      targetRole: ann.targetRole,
      priority: ann.priority ?? "normal",
      pinned: ann.pinned ?? false,
      expiresAt: ann.expiresAt ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !form.title || !form.body) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        createdBy: user?.uid ?? "",
        createdByName: profile?.displayName ?? "Admin",
        academicYear: activeYear,
      };
      if (editing) {
        await updateDocument(schoolId, "announcements", editing.id, data);
      } else {
        await addDocument(schoolId, "announcements", data);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error("Error saving announcement:", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (ann: Announcement) => {
    if (!schoolId) return;
    await updateDocument(schoolId, "announcements", ann.id, { pinned: !ann.pinned });
    await load();
  };

  const handleDelete = async (ann: Announcement) => {
    if (!schoolId || !confirm(`Delete "${ann.title}"?`)) return;
    try {
      await deleteDocument(schoolId, "announcements", ann.id);
      await load();
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const filtered = announcements
    .filter((ann) => {
      const matchSearch = ann.title.includes(search) || ann.body.includes(search);
      const expired = ann.expiresAt && ann.expiresAt < today;
      const matchArchived = showArchived ? expired : !expired;
      return matchSearch && (showArchived ? true : matchArchived || !ann.expiresAt);
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const prioOrder: Record<AnnPriority, number> = { urgent: 0, normal: 1, info: 2 };
      return prioOrder[a.priority ?? "normal"] - prioOrder[b.priority ?? "normal"];
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("announcements")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("schoolNotices")} — {activeYear} ({filtered.length})</p>
        </div>
        <RoleGuard permission="manage:announcements">
          <button
            onClick={openAdd}
            className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
          >
            + {t("newAnnouncement")}
          </button>
        </RoleGuard>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 sm:gap-3 flex-wrap">
        <input
          placeholder={t("searchAnnouncements")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-full sm:max-w-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 shadow-2xs"
        />
        <button
          onClick={() => setShowArchived((v) => !v)}
          className={`rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium transition-all shadow-2xs ${showArchived ? "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30" : "border-gray-200 bg-white text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white"}`}
        >
          📦 {t("archived")}
        </button>
      </div>

      {/* Announcements grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">{t("loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 py-20 text-center text-gray-400 text-sm">
          {t("noAnnouncementsFound")}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ann) => {
            const priority = ann.priority ?? "normal";
            const prioMeta = PRIORITY_META[priority];
            const targetMeta = TARGET_META[ann.targetRole ?? "all"];
            const isExpired = ann.expiresAt && ann.expiresAt < today;

            return (
              <div
                key={ann.id}
                className={`relative rounded-2xl border bg-white p-4 sm:p-5 transition-all hover:shadow-md dark:bg-white/5 ${
                  ann.pinned
                    ? "border-amber-300 bg-amber-50/40 dark:border-amber-500/40 dark:bg-white/5 shadow-xs"
                    : "border-gray-200 dark:border-white/10 shadow-xs"
                } ${priority === "urgent" ? "border-s-4 border-s-rose-500" : priority === "info" ? "border-s-4 border-s-blue-500" : ""}`}
              >
                {/* Badges row */}
                <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                  {ann.pinned && (
                    <span className="rounded-full border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 px-2.5 py-0.5 text-[10px] font-bold">
                      📌 Pinned
                    </span>
                  )}
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${prioMeta.color}`}>
                    {prioMeta.icon} {prioMeta.label}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 px-2.5 py-0.5 text-[10px]">
                    {targetMeta.icon} {targetMeta.label}
                  </span>
                  {isExpired && (
                    <span className="rounded-full border border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400 px-2.5 py-0.5 text-[10px]">
                      Archived
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{ann.title}</h3>
                {ann.titleEn && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ann.titleEn}</p>}
                <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{ann.body}</p>

                {/* Footer */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {t("postedBy")} <span className="font-medium text-gray-700 dark:text-gray-300">{ann.createdByName}</span>
                    {ann.expiresAt && (
                      <span className="ml-2">({t("expiresAt")} {ann.expiresAt})</span>
                    )}
                  </div>

                  <div className="flex gap-1.5 sm:gap-2">
                    <RoleGuard permission="manage:announcements">
                      <button
                        onClick={() => togglePin(ann)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-all shadow-2xs"
                      >
                        {ann.pinned ? `📌 ${t("unpin")}` : `📌 ${t("pin")}`}
                      </button>
                      <button
                        onClick={() => openEdit(ann)}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all shadow-2xs"
                      >
                        ✏️ {t("edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(ann)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all shadow-2xs"
                      >
                        🗑 {t("delete")}
                      </button>
                    </RoleGuard>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("editAnnouncement") : t("newAnnouncement")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("title")} (Arabic) *</label>
              <input
                placeholder="عنوان الإعلان"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("title")} (English)</label>
              <input
                placeholder="Announcement title"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("body")} (Arabic) *</label>
              <textarea
                rows={4}
                placeholder="نص الإعلان..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 resize-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("body")} (English)</label>
              <textarea
                rows={3}
                placeholder="Announcement body..."
                value={form.bodyEn}
                onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 resize-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("priority")}</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as AnnPriority })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="info">🔵 Info</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("targetAudience")}</label>
                <select
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value as AnnouncementTarget })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">👥 Everyone</option>
                  <option value="teacher">👨‍🏫 Teachers Only</option>
                  <option value="student">👩‍🎓 Students & Parents</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("expiresAt")} ({t("optional")})</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 bg-gray-50 w-full hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📌 {t("pinned")}</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t("cancel")}</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.body}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs"
              >
                {saving ? t("publishing") : t("publishAnn")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
