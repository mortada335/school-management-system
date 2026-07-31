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
          <h2 className="text-2xl font-bold text-white">Fees</h2>
          <p className="text-sm text-gray-400">Fees — {activeYear} (IQD)</p>
        </div>
        <button onClick={openAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
          + Add Fee Record
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Total Collected</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatIQD(paidAmount)}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-400">Total Billed</p>
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
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-xl">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-white/10 bg-gray-900/60 backdrop-blur">
            <tr>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Student</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Type</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Amount (IQD)</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Due Date</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-300">Status</th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-300">Actions</th>
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
                  <td className="px-4 py-3.5 font-medium text-white">{f.studentName}</td>
                  <td className="px-4 py-3.5 text-gray-400">{typeMeta?.label || f.type}</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-400 font-mono text-xs">{formatIQD(f.amount)}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{f.dueDate || "—"}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => togglePaidStatus(f)}
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-transform active:scale-95 ${statusMeta.color}`}
                    >
                      {statusMeta.label}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(f)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all active:scale-95"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
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
              <label className="block text-xs font-medium text-gray-300 mb-1">Student *</label>
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
                  <option key={t.value} value={t.value}>{t.label}</option>
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
                    <option key={s.value} value={s.value}>{s.label}</option>
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
