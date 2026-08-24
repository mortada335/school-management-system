import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import {
  fetchCollectionPaginated,
  addDocument,
  updateDocument,
  deleteDocument,
  orderBy,
  type QueryConstraint,
} from "@/lib/firestore-helpers";
import type { Subject } from "@/types";
import { usePagination } from "@/hooks/usePagination";
import FiltersSection from "@/components/filters-ui/FiltersSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RoleGuard from "@/components/RoleGuard";
import DeleteDialog from "@/components/ui/DeleteDialog";
import DataWrapper from "@/components/ui/DataWrapper";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Pencil, Trash2 } from "lucide-react";

export default function Subjects() {
  const { schoolId } = useAuth();
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // needed for FiltersSection, though we have no extra filters

  const { lastDoc, hasMore, resetPagination, nextPage } = usePagination();

  const loadSubjects = useCallback(async (isLoadMore = false) => {
    if (!schoolId) return;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const constraints: QueryConstraint[] = [orderBy("name")];

      const { data, lastDoc: newLastDoc, hasMore: newHasMore } = await fetchCollectionPaginated<Subject>(
        schoolId,
        "subjects",
        constraints,
        20,
        isLoadMore ? lastDoc : null
      );
      
      setSubjects(prev => isLoadMore ? [...prev, ...data] : data);
      nextPage(newLastDoc, newHasMore);
    } catch (err) {
      console.error("Error loading subjects:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [schoolId, lastDoc, nextPage]);

  useEffect(() => {
    resetPagination();
  }, [schoolId, resetPagination]);

  useEffect(() => {
    if (loading) {
      loadSubjects(false);
    }
  }, [loading, loadSubjects]);

  const triggerReload = () => setLoading(true);

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
      triggerReload();
    } catch (err) {
      console.error("Error saving subject:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s: Subject) => {
    setDeleteTarget(s);
  };

  const confirmDelete = async () => {
    if (!schoolId || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(schoolId, "subjects", deleteTarget.id);
      setDeleteTarget(null);
      triggerReload();
    } catch (err) {
      console.error("Error deleting subject:", err);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = subjects.filter((s) => {
    if (!search) return true;
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(search.toLowerCase())) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("subjects")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("courseCatalog")} ({subjects.length})</p>
        </div>
        <RoleGuard permission="manage:classes">
          <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto">
            {t("addSubject")}
          </button>
        </RoleGuard>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <FiltersSection
          searchQuery={search}
          setSearchQuery={setSearch}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          placeholderKey="searchSubjects"
          hasActiveFilters={!!search}
          onClearFilters={() => setSearch("")}
        />
      </div>

      <DataWrapper
        loading={loading}
        empty={filtered.length === 0}
        emptyMessage={search ? String(t("noSubjectsFound")) : String(t("noSubjectsFound"))}
        onClearFilters={search ? () => setSearch("") : undefined}
        skeleton={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} className="h-24" />
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
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
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    {t("delete")}
                  </button>
                </RoleGuard>
              </div>
            </div>
          ))}
        </div>
      </DataWrapper>

      {/* Pagination Load More */}
      {!loading && hasMore && subjects.filter(s => {
        if (!search) return true;
        return s.name.toLowerCase().includes(search.toLowerCase()) || 
               (s.nameEn && s.nameEn.toLowerCase().includes(search.toLowerCase()));
      }).length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => loadSubjects(true)}
            disabled={loadingMore}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-2xs"
          >
            {loadingMore ? t("loading") + "..." : t("loadMore") || "Load More"}
          </button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("editSubjectTitle") : t("addSubjectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("subjectNameAr")}</label>
              <input placeholder="الرياضيات" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("subjectNameEnCode")}</label>
              <input placeholder="Mathematics / MATH-101" value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t("cancel")}</button>
              <button onClick={handleSave} disabled={saving || !name}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs">
                {saving ? t("saving") : t("saveSubject")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        title={t("deleteSubject")}
        description={deleteTarget ? `${t("deleteConfirmMsg")} "${deleteTarget.name}"` : undefined}
        confirmLabel={String(t("delete"))}
        cancelLabel={String(t("cancel"))}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
