import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import {
  fetchCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  formatIQD,
  where,
  orderBy,
} from "@/lib/firestore-helpers";
import type { Fee, Student, FeeType, FeeStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";

const FEE_TYPES: { value: FeeType; label: string }[] = [
  { value: "tuition", label: "Tuition Fee" },
  { value: "uniform", label: "Uniform" },
  { value: "activity", label: "Activities & Trips" },
  { value: "other", label: "Other Fees" },
];

const FEE_STATUSES: { value: FeeStatus; label: string; color: string }[] = [
  { value: "paid", label: "Paid", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "unpaid", label: "Unpaid", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "partial", label: "Partial", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
];

const emptyForm = () => ({
  studentId: "",
  studentName: "",
  classId: "",
  amount: 250000,
  type: "tuition" as FeeType,
  status: "unpaid" as FeeStatus,
  dueDate: new Date().toISOString().split("T")[0],
  notes: "",
});

export default function Fees() {
  const { schoolId } = useAuth();
  const { activeYear } = useAcademicYear();

  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [feeList, studList] = await Promise.all([
        fetchCollection<Fee>(schoolId, "fees", [
          where("academicYear", "==", activeYear),
          orderBy("createdAt", "desc"),
        ]),
        fetchCollection<Student>(schoolId, "students", [
          where("enrollmentYear", "==", activeYear),
          orderBy("name"),
        ]),
      ]);
      setFees(feeList);
      setStudents(studList);
    } catch (err) {
      console.error("Error loading fees:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear]);

  useEffect(() => { load(); }, [load]);

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
      await load();
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
    await load();
  };

  const handleDelete = async (f: Fee) => {
    if (!schoolId || !confirm(`Delete fee record for "${f.studentName}"?`)) return;
    try {
      await deleteDocument(schoolId, "fees", f.id);
      await load();
    } catch (err) {
      console.error("Error deleting fee:", err);
    }
  };

  const filtered = fees.filter((f) => {
    const matchSearch = f.studentName.includes(search);
    const matchStatus = filterStatus === "all" || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((acc, f) => acc + (f.amount || 0), 0);
  const paidAmount = filtered.filter((f) => f.status === "paid").reduce((acc, f) => acc + (f.amount || 0), 0);

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: s.className,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">الرسوم الدراسية</h2>
          <p className="text-sm text-gray-400">Fees — {activeYear} (IQD)</p>
        </div>
        <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
          + Add Fee Record
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Paid / المحصّل</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatIQD(paidAmount)}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-400">Total Billed / إجمالي المستحق</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatIQD(totalAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          placeholder="Search by student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid / مدفوع</option>
          <option value="unpaid">Unpaid / غير مدفوع</option>
          <option value="partial">Partial / مدفوع جزئياً</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              {["Student", "Type", "Amount (IQD)", "Due Date", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-500">Loading fees...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-600">No fee records found. Click "+ Add Fee Record".</td></tr>
            ) : filtered.map((f) => {
              const statusMeta = FEE_STATUSES.find((s) => s.value === f.status) ?? FEE_STATUSES[1];
              const typeMeta = FEE_TYPES.find((t) => t.value === f.type);
              return (
                <tr key={f.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{f.studentName}</td>
                  <td className="px-4 py-3 text-gray-400">{typeMeta?.labelAr || f.type}</td>
                  <td className="px-4 py-3 font-bold text-emerald-400">{formatIQD(f.amount)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{f.dueDate || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePaidStatus(f)}
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-transform active:scale-95 ${statusMeta.color}`}
                    >
                      {statusMeta.labelAr}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(f)} className="text-indigo-400 hover:text-indigo-300 mr-4 text-xs">Edit</button>
                    <button onClick={() => handleDelete(f)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Shadcn Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Fee Record" : "Add Fee Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Student (Searchable Combobox) *</label>
              <Combobox
                value={form.studentId}
                onChange={(val) => setForm({ ...form, studentId: val })}
                placeholder="Search student by name..."
                options={studentOptions}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Fee Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as FeeType })}
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
              >
                {FEE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.labelAr} ({t.label})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Amount (IQD) *</label>
              <input
                type="number"
                step={5000}
                placeholder="250000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FeeStatus })}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
                >
                  {FEE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.labelAr}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.studentId || !form.amount}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
