import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import {
  fetchCollection,
  batchSetDocuments,
  where,
  orderBy,
} from "@/lib/firestore-helpers";
import type { Student, Class, Subject, Grade, GradeTerm } from "@/types";
import { Combobox } from "@/components/ui/combobox";

const TERMS: { value: GradeTerm; label: string }[] = [
  { value: "first", label: "First Term" },
  { value: "second", label: "Second Term" },
  { value: "final", label: "Final Exam" },
];

const PASS_THRESHOLD = 0.5;

export default function Grades() {
  const { schoolId, user } = useAuth();
  const { activeYear } = useAcademicYear();

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<GradeTerm>("first");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [maxScore] = useState(100);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      fetchCollection<Class>(schoolId, "classes", [where("academicYear", "==", activeYear), orderBy("grade")]),
      fetchCollection<Subject>(schoolId, "subjects", [orderBy("name")]),
    ]).then(([cls, sub]) => { setClasses(cls); setSubjects(sub); });
  }, [schoolId, activeYear]);

  const loadGrades = useCallback(async () => {
    if (!schoolId || !selectedClass || !selectedSubject) return;
    setLoadingStudents(true);
    setSaved(false);

    try {
      const [studs, existingGrades] = await Promise.all([
        fetchCollection<Student>(schoolId, "students", [
          where("classId", "==", selectedClass),
          orderBy("name"),
        ]),
        fetchCollection<Grade>(schoolId, "grades", [
          where("classId", "==", selectedClass),
          where("subjectId", "==", selectedSubject),
          where("term", "==", selectedTerm),
          where("academicYear", "==", activeYear),
        ]),
      ]);

      setStudents(studs);
      const existing: Record<string, string> = {};
      existingGrades.forEach((g) => { existing[g.studentId] = String(g.score); });
      const defaults: Record<string, string> = {};
      studs.forEach((s) => { defaults[s.id] = existing[s.id] ?? ""; });
      setScores(defaults);
    } catch (err) {
      console.error("Error loading grades:", err);
    } finally {
      setLoadingStudents(false);
    }
  }, [schoolId, selectedClass, selectedSubject, selectedTerm, activeYear]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  const handleSave = async () => {
    if (!schoolId || !selectedClass || !selectedSubject || students.length === 0) return;
    setSaving(true);
    try {
      const subject = subjects.find((s) => s.id === selectedSubject);
      const records = students
        .filter((s) => scores[s.id] !== "")
        .map((s) => ({
          id: `${s.id}_${selectedSubject}_${selectedTerm}_${activeYear}`,
          data: {
            studentId: s.id,
            studentName: s.name,
            subjectId: selectedSubject,
            subjectName: subject?.name ?? "",
            classId: selectedClass,
            term: selectedTerm,
            score: Number(scores[s.id]) || 0,
            maxScore,
            academicYear: activeYear,
            recordedBy: user?.uid ?? "",
          },
        }));
      await batchSetDocuments(schoolId, "grades", records);
      setSaved(true);
    } catch (err) {
      console.error("Error saving grades:", err);
    } finally {
      setSaving(false);
    }
  };

  const getPercent = (score: string) => {
    const n = Number(score);
    if (!score || isNaN(n)) return null;
    return Math.round((n / maxScore) * 100);
  };

  const isPassing = (score: string) => {
    const p = getPercent(score);
    return p !== null && p >= PASS_THRESHOLD * 100;
  };

  const ready = selectedClass && selectedSubject;

  const classOptions = classes.map((c) => ({ value: c.id, label: c.name, sublabel: c.nameEn }));
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name, sublabel: s.nameEn }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">الدرجات والنتائج</h2>
        <p className="text-sm text-gray-400">Grades — {activeYear}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-44">
          <label className="block text-xs text-gray-400 mb-1">Class (Combobox)</label>
          <Combobox
            value={selectedClass}
            onChange={setSelectedClass}
            placeholder="Select class..."
            options={classOptions}
          />
        </div>
        <div className="flex-1 min-w-44">
          <label className="block text-xs text-gray-400 mb-1">Subject (Combobox)</label>
          <Combobox
            value={selectedSubject}
            onChange={setSelectedSubject}
            placeholder="Select subject..."
            options={subjectOptions}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Term</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value as GradeTerm)}
            className="w-44 rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
          >
            {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {!ready ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-center text-gray-500">
          Select a class and subject to enter grades.
        </div>
      ) : loadingStudents ? (
        <div className="py-16 text-center text-gray-500">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-center text-gray-500">
          No students in this class. Click "+ Add Student" on the Students page.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Score / {maxScore}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">%</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((s, i) => {
                const pct = getPercent(scores[s.id] ?? "");
                const pass = isPassing(scores[s.id] ?? "");
                return (
                  <tr key={s.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        placeholder="—"
                        value={scores[s.id] ?? ""}
                        onChange={(e) => { setScores((p) => ({ ...p, [s.id]: e.target.value })); setSaved(false); }}
                        className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white font-mono outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400">{pct !== null ? `${pct}%` : "—"}</td>
                    <td className="px-4 py-3">
                      {pct !== null && (
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${pass ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                          {pass ? "Pass" : "Fail"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {students.length > 0 && ready && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            {saving ? "Saving..." : "Save Grades"}
          </button>
          {saved && <span className="text-green-400 text-sm">✓ Grades saved successfully</span>}
        </div>
      )}
    </div>
  );
}
