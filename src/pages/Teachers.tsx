import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import {
  fetchCollection,
  fetchCollectionPaginated,
  addDocument,
  updateDocument,
  deleteDocument,
  orderBy,
  where,
  type QueryConstraint,
} from "@/lib/firestore-helpers";
import type { Teacher, Subject } from "@/types";
import { usePagination } from "@/hooks/usePagination";
import FiltersSection from "@/components/filters-ui/FiltersSection";
import FiltersMenu from "@/components/filters-ui/FiltersMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExcelExport from "@/components/ExcelExport";
import RoleGuard from "@/components/RoleGuard";
import DeleteDialog from "@/components/ui/DeleteDialog";
import DataWrapper from "@/components/ui/DataWrapper";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import { Trash2 } from 'lucide-react';

const emptyForm = () => ({
  name: "",
  nameEn: "",
  email: "",
  phone: "",
  qualification: "",
  specialization: "",
  joinDate: "",
  status: "active" as "active" | "on-leave" | "resigned",
  notes: "",
  subjectIds: [] as string[],
  classIds: [] as string[],
});

function TeacherAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-sm font-bold text-white shadow">
      {initials}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "on-leave": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resigned: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function Teachers() {
  const { schoolId } = useAuth();
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Teacher | null>(null);
  const [assignSubjectIds, setAssignSubjectIds] = useState<string[]>([]);

  const { lastDoc, hasMore, resetPagination, nextPage } = usePagination();

  const loadSubjects = useCallback(async () => {
    if (!schoolId) return;
    try {
      const subj = await fetchCollection<Subject>(schoolId, "subjects", [orderBy("name")]);
      setAllSubjects(subj);
    } catch (err) {
      console.error("Error loading subjects:", err);
    }
  }, [schoolId]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const loadTeachers = useCallback(async (isLoadMore = false) => {
    if (!schoolId) return;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const constraints: QueryConstraint[] = [];
      if (filterStatus !== "all") {
        constraints.push(where("status", "==", filterStatus));
      }
      constraints.push(orderBy("name"));

      const { data, lastDoc: newLastDoc, hasMore: newHasMore } = await fetchCollectionPaginated<Teacher>(
        schoolId,
        "teachers",
        constraints,
        20,
        isLoadMore ? lastDoc : null
      );
      
      setTeachers(prev => isLoadMore ? [...prev, ...data] : data);
      nextPage(newLastDoc, newHasMore);
    } catch (err) {
      console.error("Error loading teachers:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [schoolId, filterStatus, lastDoc, nextPage]);

  useEffect(() => {
    resetPagination();
  }, [filterStatus, schoolId, resetPagination]);

  useEffect(() => {
    if (loading) {
      loadTeachers(false);
    }
  }, [loading, loadTeachers]);

  const triggerReload = () => setLoading(true);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      name: t.name,
      nameEn: t.nameEn,
      email: t.email,
      phone: t.phone,
      qualification: t.qualification ?? "",
      specialization: t.specialization ?? "",
      joinDate: t.joinDate ?? "",
      status: t.status ?? "active",
      notes: t.notes ?? "",
      subjectIds: t.subjectIds ?? [],
      classIds: t.classIds ?? [],
    });
    setModalOpen(true);
  };

  const openAssign = (teacher: Teacher) => {
    setAssignTarget(teacher);
    setAssignSubjectIds(teacher.subjectIds ?? []);
    setAssignModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!schoolId || !assignTarget) return;
    await updateDocument(schoolId, "teachers", assignTarget.id, { subjectIds: assignSubjectIds });
    setAssignModalOpen(false);
    triggerReload();
  };

  const toggleSubject = (id: string) => {
    setAssignSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!schoolId || !form.name) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDocument(schoolId, "teachers", editing.id, form);
      } else {
        await addDocument(schoolId, "teachers", { ...form });
      }
      setModalOpen(false);
      triggerReload();
    } catch (err) {
      console.error("Error saving teacher:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (teacher: Teacher) => {
    setDeleteTarget(teacher);
  };

  const confirmDelete = async () => {
    if (!schoolId || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(schoolId, "teachers", deleteTarget.id);
      setDeleteTarget(null);
      triggerReload();
    } catch (err) {
      console.error("Error deleting teacher:", err);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = teachers.filter((t) => {
    if (!search) return true;
    return t.name.includes(search) ||
           t.nameEn.toLowerCase().includes(search.toLowerCase()) ||
           t.email.toLowerCase().includes(search.toLowerCase()) ||
           (t.specialization ?? "").includes(search);
  });

  const excelData = filtered.map((t) => ({
    [t.name]: t.name,
    "Name (Secondary)": t.nameEn,
    [t.email || "Email"]: t.email,
    [t.phone || "Phone"]: t.phone,
    Specialization: t.specialization ?? "",
    Qualification: t.qualification ?? "",
    Status: t.status ?? "active",
    Subjects: (t.subjectIds ?? []).length,
  }));

  const assignedCount = teachers.filter((t) => (t.subjectIds ?? []).length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("teachers")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("facultyMembers")} ({teachers.length})</p>
        </div>
        <RoleGuard permission="manage:teachers">
          <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto">
            {t("addTeacher")}
          </button>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-violet-200/80 bg-violet-50/70 p-3.5 sm:p-4 text-center dark:border-violet-500/30 dark:bg-violet-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{teachers.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("totalTeachers")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 sm:p-4 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{assignedCount}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("assigned")}</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 sm:p-4 text-center dark:border-yellow-500/30 dark:bg-yellow-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{teachers.length - assignedCount}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("unassigned")}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-3.5 sm:p-4 text-center dark:border-cyan-500/30 dark:bg-cyan-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{allSubjects.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("subjects")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <FiltersSection
          searchQuery={search}
          setSearchQuery={setSearch}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          placeholderKey="searchTeachers"
          hasActiveFilters={filterStatus !== "all" || !!search}
          onClearFilters={() => {
            setSearch("");
            setFilterStatus("all");
          }}
        />
        <ExcelExport data={excelData} filename="teachers" label={t("exportExcel")} />
      </div>

      <FiltersMenu
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        filters={[
          {
            key: "status",
            label: String(t("status")),
            type: "select",
            options: [
              { value: "all", label: String(t("allStatus") || "All") },
              { value: "active", label: String(t("active")) },
              { value: "on-leave", label: String(t("onLeave")) },
              { value: "resigned", label: String(t("resigned")) },
            ],
          }
        ]}
        values={{ status: filterStatus }}
        onChange={(key, value) => {
          if (key === "status") setFilterStatus(value);
        }}
      />

      {/* Teachers Table */}
      <DataWrapper
        loading={loading}
        empty={filtered.length === 0}
        emptyMessage={String(t("noTeachersFound"))}
        onClearFilters={
          search || filterStatus !== "all"
            ? () => {
                setSearch("");
                setFilterStatus("all");
              }
            : undefined
        }
        skeleton={
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-white/10 dark:bg-white/5">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={6} />
                ))}
              </tbody>
            </table>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-white/10 dark:bg-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("teachers")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("email")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("specialization")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("subjects")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("status")}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((teacher) => {
                const subjectNames = (teacher.subjectIds ?? [])
                  .map((id) => allSubjects.find((s) => s.id === id)?.name)
                  .filter(Boolean);
                return (
                  <tr key={teacher.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TeacherAvatar name={teacher.name} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{teacher.name}</p>
                          {teacher.nameEn && <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.nameEn}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{teacher.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{teacher.specialization || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {subjectNames.length === 0 ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : subjectNames.slice(0, 3).map((name, i) => (
                          <span key={i} className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-medium">
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[teacher.status ?? "active"]}`}>
                        {teacher.status === "active" ? t("active") : teacher.status === "on-leave" ? t("onLeave") : t("resigned")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <button
                          onClick={() => openAssign(teacher)}
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 transition-all active:scale-95 shadow-2xs"
                        >
                          📚 {t("assign")}
                        </button>
                        <RoleGuard permission="manage:teachers">
                          <button
                            onClick={() => openEdit(teacher)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all active:scale-95 shadow-2xs"
                          >
                            ✏️ {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(teacher)}
                            className="flex justify-center items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95"
                          >
                            <Trash2 size={14} />
                            {t("delete")}
                          </button>
                        </RoleGuard>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataWrapper>

      {/* Pagination Load More */}
      {!loading && hasMore && filtered.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => loadTeachers(true)}
            disabled={loadingMore}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-2xs"
          >
            {loadingMore ? t("loading") + "..." : t("loadMore") || "Load More"}
          </button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTeacher") : t("addTeacher")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("fullName")} *</label>
                <input placeholder="أحمد علي الكريمي" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("secondaryName")}</label>
                <input placeholder="A. Al-Karimi" value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("email")}</label>
                <input type="email" placeholder="teacher@school.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("phone")}</label>
                <input placeholder="07xx-xxx-xxxx" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("specialization")}</label>
                <input placeholder="الرياضيات" value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("qualification")}</label>
                <select value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white">
                  <option value="">—</option>
                  <option value="بكالوريوس">بكالوريوس</option>
                  <option value="ماجستير">ماجستير</option>
                  <option value="دكتوراه">دكتوراه</option>
                  <option value="دبلوم">دبلوم</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("joinDate")}</label>
                <input type="date" value={form.joinDate}
                  onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("status")}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "on-leave" | "resigned" })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white">
                  <option value="active">{t("active")}</option>
                  <option value="on-leave">{t("onLeave")}</option>
                  <option value="resigned">{t("resigned")}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("notes")} ({t("optional")})</label>
              <textarea rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t("cancel")}</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs">
                {saving ? t("saving") : t("saveTeacher")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Subjects Dialog */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assignSubjects")} — {assignTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
            {allSubjects.map((subj) => (
              <label key={subj.id} className="flex items-center gap-3 cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={assignSubjectIds.includes(subj.id)}
                  onChange={() => toggleSubject(subj.id)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{subj.name}</p>
                  {subj.nameEn && <p className="text-xs text-gray-500 dark:text-gray-400">{subj.nameEn}</p>}
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <button onClick={() => setAssignModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t("cancel")}</button>
            <button onClick={handleSaveAssignment} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-all shadow-xs">
              {t("save")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        title={t("deleteTeacher")}
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
