import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import {
  countDocuments,
  fetchCollection,
  formatIQD,
  where,
  orderBy,
} from "@/lib/firestore-helpers";
import type { Announcement, Fee, AttendanceRecord } from "@/types";

export default function Overview() {
  const { user, profile, school, schoolId } = useAuth();
  const { activeYear } = useAcademicYear();

  const firstName =
    (profile?.displayName ?? user?.displayName ?? user?.email ?? "Admin").split(" ")[0];

  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);
  const [feesCollected, setFeesCollected] = useState<number | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<{ present: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      const [sCount, tCount, cCount, paidFees, annList, todayAtt] = await Promise.all([
        countDocuments(schoolId, "students", [where("enrollmentYear", "==", activeYear)]),
        countDocuments(schoolId, "teachers"),
        countDocuments(schoolId, "classes", [where("academicYear", "==", activeYear)]),
        fetchCollection<Fee>(schoolId, "fees", [
          where("academicYear", "==", activeYear),
          where("status", "==", "paid"),
        ]),
        fetchCollection<Announcement>(schoolId, "announcements", [
          where("academicYear", "==", activeYear),
          orderBy("createdAt", "desc"),
        ]),
        fetchCollection<AttendanceRecord>(schoolId, "attendance", [
          where("academicYear", "==", activeYear),
          where("date", "==", today),
        ]),
      ]);

      setStudentCount(sCount);
      setTeacherCount(tCount);
      setClassCount(cCount);

      const totalPaid = paidFees.reduce((acc, f) => acc + (f.amount || 0), 0);
      setFeesCollected(totalPaid);
      setRecentAnnouncements(annList.slice(0, 3));

      const presentCount = todayAtt.filter((a) => a.status === "present").length;
      setTodayAttendance({ present: presentCount, total: todayAtt.length });
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeYear]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const statCards = [
    {
      label: "Total Students",
      labelAr: "إجمالي الطلاب",
      value: loading || studentCount === null ? "..." : studentCount.toLocaleString(),
      color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
    },
    {
      label: "Teachers",
      labelAr: "المعلمون",
      value: loading || teacherCount === null ? "..." : teacherCount.toLocaleString(),
      color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
    },
    {
      label: "Classes",
      labelAr: "الصفوف",
      value: loading || classCount === null ? "..." : classCount.toLocaleString(),
      color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    },
    {
      label: "Fees Collected",
      labelAr: "الرسوم المحصّلة",
      value: loading || feesCollected === null ? "..." : formatIQD(feesCollected),
      color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {firstName} 👋
          </h2>
          <p className="mt-1 text-gray-400">
            {school?.name ?? "Your school"} dashboard — active academic year: <span className="text-indigo-400 font-semibold">{activeYear}</span>
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border bg-gradient-to-br p-5 ${card.color}`}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Dynamic Dashboard Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Announcements */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent Announcements
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading announcements...</p>
          ) : recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-600 italic">No announcements published yet for {activeYear}.</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((ann) => (
                <div key={ann.id} className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">{ann.titleEn || ann.title}</p>
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">{ann.bodyEn || ann.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Attendance Summary */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Today's Attendance
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading attendance data...</p>
          ) : !todayAttendance || todayAttendance.total === 0 ? (
            <p className="text-sm text-gray-600 italic">No attendance recorded yet for today.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-white">
                  {Math.round((todayAttendance.present / todayAttendance.total) * 100)}%
                </span>
                <span className="text-sm text-gray-400">
                  {todayAttendance.present} / {todayAttendance.total} students present
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((todayAttendance.present / todayAttendance.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
