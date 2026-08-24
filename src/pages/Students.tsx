import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
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
import type { Student, Class } from "@/types";
import { usePagination } from "@/hooks/usePagination";
import FiltersSection from "@/components/filters-ui/FiltersSection";
import FiltersMenu from "@/components/filters-ui/FiltersMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import ExcelExport from "@/components/ExcelExport";
import RoleGuard from "@/components/RoleGuard";
import DeleteDialog from "@/components/ui/DeleteDialog";
import DataWrapper from "@/components/ui/DataWrapper";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import { differenceInYears, parseISO } from "date-fns";
import { Trash2 } from 'lucide-react';

const emptyForm = () => ({
  name: "",
  nameEn: "",
  classId: "",
  gender: "male" as "male" | "female",
  dateOfBirth: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
  bloodGroup: "",
  nationalId: "",
  notes: "",
});

function calcAge(dob: string): string {
  if (!dob) return "—";
  try {
    const age = differenceInYears(new Date(), parseISO(dob));
    return `${age}`;
  } catch {
    return "—";
  }
}

function Avatar({ name, gender }: { name: string; gender: "male" | "female" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bg = gender === "male"
    ? "from-blue-600 to-indigo-600"
    : "from-pink-500 to-violet-600";
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${bg} text-xs font-bold text-white shadow`}>
      {initials}
    </div>
  );
}

export default function Students() {
  const { schoolId } = useAuth();
  const { activeYear } = useAcademicYear();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { lastDoc, hasMore, resetPagination, nextPage } = usePagination();

  const loadClasses = useCallback(async () => {
    if (!schoolId) return;
    try {
      const cls = await fetchCollection<Class>(schoolId, "classes", [
        where("academicYear", "==", activeYear),
        orderBy("grade"),
      ]);
      setClasses(cls);
    } catch (err) {
      console.error("Error loading classes:", err);
    }
  }, [schoolId, activeYear]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const loadStudents = useCallback(async (isLoadMore = false) => {
    if (!schoolId) return;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const constraints: QueryConstraint[] = [
        where("enrollmentYear", "==", activeYear)
      ];
      if (filterClass !== "all") constraints.push(where("classId", "==", filterClass));
      if (filterGender !== "all") constraints.push(where("gender", "==", filterGender));
      // Ordering by name might require composite indexes if filters are used.
      // If it throws an index error in the console, the Firebase link will be provided there.
      constraints.push(orderBy("name"));

      const { data, lastDoc: newLastDoc, hasMore: newHasMore } = await fetchCollectionPaginated<Student>(
        schoolId,
        "students",
        constraints,
        20,
        isLoadMore ? lastDoc : null
      );
      
      setStudents(prev => isLoadMore ? [...prev, ...data] : data);
      nextPage(newLastDoc, newHasMore);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [schoolId, activeYear, filterClass, filterGender, lastDoc, nextPage]);

  // Initial load and filter change load
  useEffect(() => {
    resetPagination();
    // We intentionally don't put loadStudents in the dependency array to avoid loops,
    // but we trigger it when filters change.
  }, [filterClass, filterGender, activeYear, schoolId, resetPagination]);

  useEffect(() => {
    if (loading) {
      loadStudents(false);
    }
  }, [loading, loadStudents]);

  // Allow triggering a fresh load
  const triggerReload = () => setLoading(true);

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
      address: s.address ?? "",
      bloodGroup: s.bloodGroup ?? "",
      nationalId: s.nationalId ?? "",
      notes: s.notes ?? "",
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
      triggerReload();
    } catch (err) {
      console.error("Error saving student:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s: Student) => {
    setDeleteTarget(s);
  };

  const confirmDelete = async () => {
    if (!schoolId || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(schoolId, "students", deleteTarget.id);
      setDeleteTarget(null);
      triggerReload();
    } catch (err) {
      console.error("Error deleting student:", err);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!search) return true;
    return s.name.includes(search) ||
           s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
           (s.guardianName ?? "").includes(search);
  });

  const maleCount = students.filter((s) => s.gender === "male").length;
  const femaleCount = students.filter((s) => s.gender === "female").length;

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.nameEn,
  }));

  const excelData = filtered.map((s) => ({
    [t("name")]: s.name,
    "Secondary Name": s.nameEn,
    [t("class")]: s.className,
    [t("gender")]: s.gender === "male" ? t("male") : t("female"),
    [t("dateOfBirth")]: s.dateOfBirth,
    [t("age")]: calcAge(s.dateOfBirth),
    [t("guardian")]: s.guardianName,
    [t("phone")]: s.guardianPhone,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("students")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {t("enrolledStudents")} — {activeYear} ({students.length} {t("totalStudents").toLowerCase()})
          </p>
        </div>
        <RoleGuard permission="manage:students">
          <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto">
            {t("addStudentBtn")}
          </button>
        </RoleGuard>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-3.5 sm:p-4 text-center dark:border-indigo-500/30 dark:bg-indigo-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("totalStudents")}</p>
        </div>
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3.5 sm:p-4 text-center dark:border-blue-500/30 dark:bg-blue-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{maleCount}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("male")}</p>
        </div>
        <div className="rounded-2xl border border-pink-200/80 bg-pink-50/70 p-3.5 sm:p-4 text-center dark:border-pink-500/30 dark:bg-pink-500/10 shadow-xs">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{femaleCount}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t("female")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <FiltersSection
          searchQuery={search}
          setSearchQuery={setSearch}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          placeholderKey="searchStudents"
          hasActiveFilters={filterClass !== "all" || filterGender !== "all" || !!search}
          onClearFilters={() => {
            setSearch("");
            setFilterClass("all");
            setFilterGender("all");
          }}
        />
        <ExcelExport data={excelData} filename="students" label={t("exportExcel")} />
      </div>

      <FiltersMenu
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        filters={[
          {
            key: "classId",
            label: String(t("class")),
            type: "select",
            options: [{ value: "all", label: String(t("allClasses")) }, ...classOptions],
          },
          {
            key: "gender",
            label: String(t("gender")),
            type: "select",
            options: [
              { value: "all", label: String(t("allGenders")) },
              { value: "male", label: String(t("male")) },
              { value: "female", label: String(t("female")) },
            ],
          },
        ]}
        values={{ classId: filterClass, gender: filterGender }}
        onChange={(key, value) => {
          if (key === "classId") setFilterClass(value);
          if (key === "gender") setFilterGender(value);
        }}
      />

      {/* Table */}
      <DataWrapper
        loading={loading}
        empty={filtered.length === 0}
        emptyMessage={String(t("noStudentsFound"))}
        onClearFilters={
          search || filterClass !== "all" || filterGender !== "all"
            ? () => {
                setSearch("");
                setFilterClass("all");
                setFilterGender("all");
              }
            : undefined
        }
        skeleton={
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-white/10 dark:bg-white/5">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={7} />
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
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("student")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("class")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("gender")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("age")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("guardianName")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("phone")}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} gender={s.gender} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                        {s.nameEn && <p className="text-xs text-gray-500 dark:text-gray-400">{s.nameEn}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{s.className}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${s.gender === "male" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30" : "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/30"}`}>
                      {s.gender === "male" ? t("male") : t("female")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{calcAge(s.dateOfBirth)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{s.guardianName || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{s.guardianPhone || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/students/${s.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20 transition-all shadow-2xs"
                      >
                        👁 {t("view")}
                      </button>
                      <RoleGuard permission="manage:students">
                        <button
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all active:scale-95 shadow-2xs"
                        >
                          ✏️ {t("edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="flex justify-between items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 shadow-2xs"
                        >
                          <Trash2 size={14} />
                          {t("delete")}
                        </button>
                      </RoleGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataWrapper>

      {/* Pagination Load More */}
      {!loading && hasMore && filtered.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => loadStudents(true)}
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
            <DialogTitle>{editing ? t("editStudent") : t("addStudentBtn")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("fullName")} *</label>
                <input placeholder="محمد علي حسن" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("secondaryName")}</label>
                <input placeholder="M. Ali" value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("class")} *</label>
                <Combobox
                  value={form.classId}
                  onChange={(val) => setForm({ ...form, classId: val })}
                  placeholder={t("selectClass")}
                  options={classOptions}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("gender")}</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white">
                  <option value="male">{t("male")}</option>
                  <option value="female">{t("female")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dateOfBirth")}</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("guardianName")}</label>
                <input placeholder="علي حسن محمد" value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("guardianPhone")}</label>
                <input placeholder="07xx-xxx-xxxx" value={form.guardianPhone}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group ({t("optional")})</label>
                <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white">
                  <option value="">—</option>
                  {["A+","A−","B+","B−","AB+","AB−","O+","O−"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">National ID ({t("optional")})</label>
                <input placeholder="National ID No." value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
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
              <button onClick={handleSave} disabled={saving || !form.name || !form.classId}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs">
                {saving ? t("saving") : t("saveStudent")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        title={t("deleteStudent")}
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
