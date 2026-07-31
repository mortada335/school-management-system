import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import {
  fetchCollection,
  batchSetDocuments,
  schoolCol,
  where,
  orderBy,
  getDocs,
  query,
} from "@/lib/firestore-helpers";
import type { Student, Class, AttendanceRecord, AttendanceStatus } from "@/types";

const STATUS_BUTTONS: { status: AttendanceStatus; label: string; active: string; inactive: string }[] = [
  { status: "present", label: "Present", active: "bg-green-500 text-white", inactive: "bg-green-500/20 text-green-400 border-green-500/30" },
  { status: "absent", label: "Absent", active: "bg-red-500 text-white", inactive: "bg-red-500/20 text-red-400 border-red-500/30" },
  { status: "late", label: "Late", active: "bg-yellow-500 text-white", inactive: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { status: "excused", label: "Excused", active: "bg-blue-500 text-white", inactive: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
];

export default function Attendance() {
  const { schoolId, user } = useAuth();
  const { activeYear } = useAcademicYear();

  const today = new Date().toISOString().split("T")[0];

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    fetchCollection<Class>(schoolId, "classes", [
      where("academicYear", "==", activeYear),
      orderBy("grade"),
    ]).then(setClasses);
  }, [schoolId, activeYear]);

  useEffect(() => {
    if (!schoolId || !selectedClass || !selectedDate) return;
    setLoadingStudents(true);

    Promise.all([
      fetchCollection<Student>(schoolId, "students", [
        where("classId", "==", selectedClass),
        orderBy("name"),
      ]),
      getDocs(
        query(
          schoolCol(schoolId, "attendance"),
          where("classId", "==", selectedClass),
          where("date", "==", selectedDate)
        )
      ),
    ]).then(([studs, attSnap]) => {
      setStudents(studs);
      const existing: Record<string, AttendanceStatus> = {};
      attSnap.forEach((d) => {
        const rec = d.data() as AttendanceRecord;
        existing[rec.studentId] = rec.status;
      });
      const defaults: Record<string, AttendanceStatus> = {};
      studs.forEach((s) => { defaults[s.id] = existing[s.id] ?? "present"; });
      setStatuses(defaults);
      setLoadingStudents(false);
      setSaved(false);
    });
  }, [schoolId, selectedClass, selectedDate]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!schoolId || !selectedClass || !selectedDate || students.length === 0) return;
    setSaving(true);
    const records = students.map((s) => ({
      id: `${s.id}_${selectedDate}`,
      data: {
        studentId: s.id, studentName: s.name, classId: selectedClass,
        date: selectedDate, status: statuses[s.id] ?? "present",
        academicYear: activeYear, recordedBy: user?.uid ?? "",
      },
    }));
    await batchSetDocuments(schoolId, "attendance", records);
    setSaving(false);
    setSaved(true);
  };

  const summary = Object.values(statuses).reduce(
    (acc, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc; },
    {} as Record<AttendanceStatus, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Daily Attendance Register</h2>
        <p className="text-sm text-gray-400">Attendance — {activeYear}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-400 mb-1">Class</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
            <option value="">Select class...</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
        </div>
      </div>

      {students.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          {STATUS_BUTTONS.map(({ status, label, inactive }) => (
            <div key={status} className={`rounded-lg border px-4 py-2 text-sm ${inactive}`}>
              {label}: <span className="font-bold">{summary[status] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {!selectedClass ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-center text-gray-500">
          Select a class to start recording attendance.
        </div>
      ) : loadingStudents ? (
        <div className="py-16 text-center text-gray-500">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-center text-gray-500">
          No students in this class yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.nameEn}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_BUTTONS.map(({ status, label, active, inactive }) => (
                        <button
                          key={status}
                          onClick={() => setStatus(s.id, status)}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${statuses[s.id] === status ? active : inactive} ${statuses[s.id] === status ? "ring-2 ring-white/30" : "opacity-60 hover:opacity-100"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {students.length > 0 && (
        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {saving ? "Saving..." : "Save Attendance"}
          </button>
          {saved && <span className="text-green-400 text-sm">✓ Saved successfully</span>}
        </div>
      )}
    </div>
  );
}
