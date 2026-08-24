import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useTranslation } from "@/lib/i18n";
import {
  fetchCollection,
  fetchCollectionPaginated,
  addDocument,
  updateDocument,
  deleteDocument,
  formatIQD,
  where,
  orderBy,
  type QueryConstraint,
} from "@/lib/firestore-helpers";
import type { Fee, Student, FeeType, FeeStatus } from "@/types";
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
import { Trash2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";


const emptyForm = () => ({
  studentId: "",
  studentName: "",
  classId: "",
  amount: 250000,
  type: "tuition" as FeeType,
  status: "unpaid" as FeeStatus,
  dueDate: new Date().toISOString().split("T")[0],
  notes: "",
  paidAmount: 0,
  paymentMethod: "" as "cash" | "bank_transfer" | "card" | "",
  receiptNumber: "",
});

const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#94a3b8"];

export default function Fees() {
  const { schoolId } = useAuth();
  const { activeYear } = useAcademicYear();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const FEE_TYPES = useMemo(() => [
    { value: "tuition"  as FeeType, label: t("tuition") },
    { value: "uniform"  as FeeType, label: t("uniform") },
    { value: "activity" as FeeType, label: t("activity") },
    { value: "other"    as FeeType, label: t("other") },
  ], [t]);

  const FEE_STATUSES = useMemo(() => [
    { value: "paid"    as FeeStatus, label: t("paid"),    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30" },
    { value: "unpaid"  as FeeStatus, label: t("unpaid"),  color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30" },
    { value: "partial" as FeeStatus, label: t("partial"), color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30" },
  ], [t]);

  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Fee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { lastDoc, hasMore, resetPagination, nextPage } = usePagination();

  const loadStudents = useCallback(async () => {
    if (!schoolId) return;
    try {
      const studList = await fetchCollection<Student>(schoolId, "students", [
        where("enrollmentYear", "==", activeYear),
        orderBy("name"),
      ]);
      setStudents(studList);
    } catch (err) {
      console.error(err);
    }
  }, [schoolId, activeYear]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadFees = useCallback(async (isLoadMore = false) => {
    if (!schoolId) return;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const constraints: QueryConstraint[] = [
        where("academicYear", "==", activeYear),
      ];
      if (filterStatus !== "all") {
        constraints.push(where("status", "==", filterStatus));
      }
      constraints.push(orderBy("createdAt", "desc"));

      const { data, lastDoc: newLastDoc, hasMore: newHasMore } = await fetchCollectionPaginated<Fee>(
        schoolId,
        "fees",
        constraints,
        20,
        isLoadMore ? lastDoc : null
      );
      
      setFees(prev => isLoadMore ? [...prev, ...data] : data);
      nextPage(newLastDoc, newHasMore);
    } catch (err) {
      console.error("Error loading fees:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [schoolId, activeYear, filterStatus, lastDoc, nextPage]);

  useEffect(() => {
    resetPagination();
  }, [filterStatus, activeYear, schoolId, resetPagination]);

  useEffect(() => {
    if (loading) {
      loadFees(false);
    }
  }, [loading, loadFees]);

  const triggerReload = () => setLoading(true);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (f: Fee) => {
    setEditing(f);
    setForm({
      studentId: f.studentId,
      studentName: f.studentName,
      classId: f.classId,
      amount: f.amount,
      type: f.type,
      status: f.status,
      dueDate: f.dueDate,
      notes: f.notes || "",
      paidAmount: f.paidAmount ?? 0,
      paymentMethod: f.paymentMethod ?? "",
      receiptNumber: f.receiptNumber ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !form.studentId || !form.amount) return;
    setSaving(true);
    try {
      const student = students.find((s) => s.id === form.studentId);
      const data = {
        ...form,
        studentName: student?.name ?? form.studentName,
        classId: student?.classId ?? form.classId,
        paidAt: form.status === "paid" ? new Date().toISOString() : null,
        academicYear: activeYear,
      };

      if (editing) {
        await updateDocument(schoolId, "fees", editing.id, data);
      } else {
        await addDocument(schoolId, "fees", data);
      }
      setModalOpen(false);
      triggerReload();
    } catch (err) {
      console.error("Error saving fee:", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePaidStatus = async (f: Fee) => {
    if (!schoolId) return;
    const nextStatus: FeeStatus = f.status === "paid" ? "unpaid" : "paid";
    await updateDocument(schoolId, "fees", f.id, {
      status: nextStatus,
      paidAt: nextStatus === "paid" ? new Date().toISOString() : null,
    });
    triggerReload();
  };

  const handleDelete = (f: Fee) => {
    setDeleteTarget(f);
  };

  const confirmDelete = async () => {
    if (!schoolId || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(schoolId, "fees", deleteTarget.id);
      setDeleteTarget(null);
      triggerReload();
    } catch (err) {
      console.error("Error deleting fee:", err);
    } finally {
      setDeleting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const filtered = fees.filter((f) => {
    if (!search && !showOverdueOnly) return true;
    const matchSearch = !search || f.studentName.toLowerCase().includes(search.toLowerCase());
    const matchOverdue = !showOverdueOnly || (f.status !== "paid" && f.dueDate && f.dueDate < today);
    return matchSearch && matchOverdue;
  });

  const totalAmount = filtered.reduce((acc, f) => acc + (f.amount || 0), 0);
  const paidAmount = filtered.filter((f) => f.status === "paid").reduce((acc, f) => acc + (f.amount || 0), 0);
  const outstanding = totalAmount - paidAmount;
  const overdueCount = fees.filter((f) => f.status !== "paid" && f.dueDate && f.dueDate < today).length;

  // Fee type breakdown for pie
  const typeBreakdown = FEE_TYPES.map((ft) => ({
    name: ft.label,
    value: filtered.filter((f) => f.type === ft.value).reduce((a, f) => a + f.amount, 0),
  })).filter((d) => d.value > 0);

  // Monthly bar data
  const monthMap: Record<string, { paid: number; unpaid: number }> = {};
  for (const f of fees) {
    const key = f.dueDate ? f.dueDate.substring(0, 7) : "—";
    if (!monthMap[key]) monthMap[key] = { paid: 0, unpaid: 0 };
    if (f.status === "paid") monthMap[key].paid += f.amount;
    else monthMap[key].unpaid += f.amount;
  }
  const monthBarData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([m, v]) => ({ month: m.substring(5), ...v }));

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: s.className,
  }));

  const excelData = filtered.map((f) => ({
    [t("student")]: f.studentName,
    [t("feeType")]: FEE_TYPES.find((type) => type.value === f.type)?.label ?? f.type,
    [t("amount")]: f.amount,
    [t("dueDate")]: f.dueDate,
    [t("paymentStatus")]: f.status,
    "Receipt No.": f.receiptNumber ?? "",
    [t("paymentMethod")]: f.paymentMethod ?? "",
    [t("notes")]: f.notes,
  }));

  const gridStroke = isDark ? "#ffffff15" : "#e2e8f0";
  const axisColor = isDark ? "#9ca3af" : "#64748b";
  const tooltipStyle = isDark
    ? { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, color: "#fff" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#0f172a", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("fees")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("schoolFees")} — {activeYear} (IQD)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelExport data={excelData} filename="fees" label={t("exportFees")} />
          <RoleGuard permission="manage:fees">
            <button onClick={openAdd} className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all">
              {t("addFeeRecord")}
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 sm:p-5 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{t("totalCollected")}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatIQD(paidAmount)}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-4 sm:p-5 shadow-xs dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">{t("totalBilled")}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatIQD(totalAmount)}</p>
        </div>
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 sm:p-5 shadow-xs dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">{t("outstanding")}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatIQD(outstanding)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 sm:p-5 shadow-xs dark:border-yellow-500/30 dark:bg-yellow-500/10">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">⚠ {t("overdue")}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{overdueCount}</p>
        </div>
      </div>

      {/* Collection Rate */}
      {totalAmount > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
          <div className="flex justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t("collectionRate")}</span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{Math.round((paidAmount / totalAmount) * 100)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round((paidAmount / totalAmount) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        {monthBarData.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">📊 {t("monthlyRevenue")}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthBarData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string | readonly (number | string)[] | undefined) => formatIQD(Number(v ?? 0))} />
                <Bar dataKey="paid" fill="#10b981" name={t("paid")} radius={[4, 4, 0, 0]} />
                <Bar dataKey="unpaid" fill="#ef4444" name={t("unpaid")} radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Fees by Type */}
        {typeBreakdown.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">🍩 {t("feesByType")}</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={typeBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {typeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string | readonly (number | string)[] | undefined) => formatIQD(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {typeBreakdown.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-300">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{formatIQD(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <FiltersSection
          searchQuery={search}
          setSearchQuery={setSearch}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          placeholderKey="searchStudents"
          hasActiveFilters={filterStatus !== "all" || showOverdueOnly || !!search}
          onClearFilters={() => {
            setSearch("");
            setFilterStatus("all");
            setShowOverdueOnly(false);
          }}
        />
        <button
          onClick={() => setShowOverdueOnly((v) => !v)}
          className={`rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium transition-all shadow-2xs ${showOverdueOnly ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" : "border-gray-200 bg-white text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white"}`}
        >
          ⚠ {t("showOverdueOnly")}
        </button>
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
              { value: "all", label: String(t("allStatuses") || "All") },
              ...FEE_STATUSES.map(s => ({ value: s.value, label: s.label }))
            ],
          }
        ]}
        values={{ status: filterStatus }}
        onChange={(key, value) => {
          if (key === "status") setFilterStatus(value);
        }}
      />

      {/* Table */}
      <DataWrapper
        loading={loading}
        empty={filtered.length === 0}
        emptyMessage={String(t("noFeesFound"))}
        onClearFilters={
          search || filterStatus !== "all" || showOverdueOnly
            ? () => {
                setSearch("");
                setFilterStatus("all");
                setShowOverdueOnly(false);
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
        <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto shadow-sm dark:border-white/10 dark:bg-white/5">
          <table className="w-full text-xs sm:text-sm text-left min-w-[800px]">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/60">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("student")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("feeType")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("amount")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("dueDate")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("paymentStatus")}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Receipt</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((f) => {
                const statusMeta = FEE_STATUSES.find((s) => s.value === f.status) ?? FEE_STATUSES[1];
                const typeMeta = FEE_TYPES.find((t) => t.value === f.type);
                const isOverdue = f.status !== "paid" && f.dueDate && f.dueDate < today;
                return (
                  <tr key={f.id} className={`hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors ${isOverdue ? "bg-amber-50/40 dark:bg-amber-500/5" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {f.studentName}
                      {isOverdue && <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 rounded-full px-1.5 py-0.5 font-normal">⚠ Overdue</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{typeMeta?.label || f.type}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs sm:text-sm">{formatIQD(f.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{f.dueDate || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePaidStatus(f)}
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-transform active:scale-95 ${statusMeta.color}`}
                      >
                        {statusMeta.label}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{f.receiptNumber || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <RoleGuard permission="manage:fees">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          <button
                            onClick={() => openEdit(f)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all active:scale-95 shadow-2xs"
                          >
                            ✏️ {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(f)}
                            className="flex justify-between items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 shadow-2xs"
                          >
                            <Trash2 size={14} />
                            {t("delete")}
                          </button>
                        </div>
                      </RoleGuard>
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
            onClick={() => loadFees(true)}
            disabled={loadingMore}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-2xs"
          >
            {loadingMore ? t("loading") + "..." : t("loadMore") || "Load More"}
          </button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("editFee") : t("addFeeRecord")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("student")} *</label>
              <Combobox
                value={form.studentId}
                onChange={(val) => setForm({ ...form, studentId: val })}
                placeholder={t("searchStudents")}
                options={studentOptions}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("feeType")}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as FeeType })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  {FEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("amount")} (IQD) *</label>
                <input
                  type="number"
                  step={5000}
                  placeholder="250000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 font-mono outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dueDate")}</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("paymentStatus")}</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FeeStatus })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  {FEE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("paymentMethod")}</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as typeof form.paymentMethod })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">—</option>
                  <option value="cash">{t("cash")}</option>
                  <option value="bank_transfer">{t("bankTransfer")}</option>
                  <option value="card">{t("card")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("receiptNumber")}</label>
                <input
                  placeholder="RCP-1001"
                  value={form.receiptNumber}
                  onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 font-mono outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t("cancel")}</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.studentId || !form.amount}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs"
              >
                {saving ? t("saving") : t("saveFee")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        title={t("deleteFeeRecord")}
        description={deleteTarget ? `${t("deleteConfirmMsg")} "${deleteTarget.studentName}" – ${formatIQD(deleteTarget.amount)}` : undefined}
        confirmLabel={String(t("delete"))}
        cancelLabel={String(t("cancel"))}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
