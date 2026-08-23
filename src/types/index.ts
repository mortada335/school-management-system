// ─── Core Auth Types ────────────────────────────────────────────────────────
export type Role = "superadmin" | "admin" | "teacher" | "student";
export type AnnPriority = "urgent" | "normal" | "info";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  schoolId: string;
  role: Role;
  createdAt: Date;
}

export interface School {
  id: string;
  name: string;
  nameAr: string;
  plan: "free" | "pro";
  createdAt: Date;
}

// ─── Academic Year ───────────────────────────────────────────────────────────
/** Format: "2025-2026" */
export type AcademicYear = string;

/** Generate list of Iraqi academic years (Sept–June). */
export function getAcademicYears(): AcademicYear[] {
  const currentYear = new Date().getFullYear();
  const years: AcademicYear[] = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(`${y - 1}-${y}`);
  }
  return years;
}

/** Current Iraqi academic year based on month (Sept = new year). */
export function currentAcademicYear(): AcademicYear {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

// ─── School Modules ──────────────────────────────────────────────────────────

export interface Class {
  id: string;
  name: string;        // "الصف السابع - شعبة أ"
  nameEn: string;      // "Grade 7 - Section A"
  grade: number;       // 1–12
  section: string;     // "A", "B", "C"
  teacherId: string;   // homeroom teacher id
  teacherName: string; // denormalized
  academicYear: AcademicYear;
  // extended fields
  capacity?: number;
  room?: string;
  schedule?: "morning" | "afternoon";
  schoolId: string;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;    // Arabic
  nameEn: string;  // English
  // extended fields
  category?: "core" | "elective" | "language";
  weeklyHours?: number;
  description?: string;
  schoolId: string;
  createdAt: Date;
}

export interface Teacher {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  subjectIds: string[];
  classIds: string[];
  // extended fields
  qualification?: string;
  specialization?: string;
  joinDate?: string;
  status?: "active" | "on-leave" | "resigned";
  notes?: string;
  schoolId: string;
  createdAt: Date;
}

export type Gender = "male" | "female";

export interface Student {
  id: string;
  name: string;
  nameEn: string;
  classId: string;
  className: string;   // denormalized
  gender: Gender;
  dateOfBirth: string; // "YYYY-MM-DD"
  guardianName: string;
  guardianPhone: string;
  enrollmentYear: AcademicYear;
  // extended fields
  address?: string;
  bloodGroup?: string;
  nationalId?: string;
  notes?: string;
  schoolId: string;
  createdAt: Date;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string; // denormalized
  classId: string;
  date: string;        // "YYYY-MM-DD"
  status: AttendanceStatus;
  notes?: string;
  academicYear: AcademicYear;
  schoolId: string;
  recordedBy: string;  // uid
}

export type GradeTerm = "first" | "second" | "final";

export interface Grade {
  id: string;
  studentId: string;
  studentName: string; // denormalized
  subjectId: string;
  subjectName: string; // denormalized
  classId: string;
  term: GradeTerm;
  score: number;
  maxScore: number;    // default 100
  academicYear: AcademicYear;
  schoolId: string;
  recordedBy: string;
}

export type FeeType = "tuition" | "uniform" | "activity" | "other";
export type FeeStatus = "paid" | "unpaid" | "partial";

export interface Fee {
  id: string;
  studentId: string;
  studentName: string; // denormalized
  classId: string;
  amount: number;      // IQD
  type: FeeType;
  status: FeeStatus;
  dueDate: string;     // "YYYY-MM-DD"
  paidAt: string | null;
  notes: string;
  // extended fields
  paidAmount?: number;
  paymentMethod?: "cash" | "bank_transfer" | "card" | "";
  receiptNumber?: string;
  academicYear: AcademicYear;
  schoolId: string;
  createdAt: Date;
}

export type AnnouncementTarget = "all" | "teacher" | "student";

export interface Announcement {
  id: string;
  title: string;
  titleEn: string;
  body: string;
  bodyEn: string;
  targetRole: AnnouncementTarget;
  createdBy: string;      // uid
  createdByName: string;  // denormalized
  academicYear: AcademicYear;
  // extended fields
  priority?: AnnPriority;
  pinned?: boolean;
  expiresAt?: string;
  schoolId: string;
  createdAt: Date;
}
