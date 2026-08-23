/**
 * Seed Script — Creates demo school, 4 user accounts, and realistic fake data.
 *
 * ⚠️  IMPORTANT: Firebase's `createUserWithEmailAndPassword` auto-signs in the
 *     newly created user, which would destroy the current session. To avoid this
 *     we use a SECONDARY Firebase app instance that is independent of the main
 *     app's auth state. This secondary app is deleted after seeding completes.
 *
 * Demo accounts created:
 *   superadmin@demo.school  / Demo@12345
 *   admin@demo.school       / Demo@12345
 *   teacher@demo.school     / Demo@12345
 *   student@demo.school     / Demo@12345
 *
 * School ID: demo-school-2025
 */

import { doc, serverTimestamp, setDoc, writeBatch, getFirestore } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, getAuth } from "firebase/auth";
import { initializeApp as initApp, deleteApp } from "firebase/app";
import { db } from "./firebase";

const SCHOOL_ID = "demo-school-2025";
const YEAR = "2025-2026";
const PASSWORD = "Demo@12345";

// ─── Demo Users ───────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { email: "superadmin@demo.school", displayName: "مدير عام النظام", role: "superadmin" },
  { email: "admin@demo.school",      displayName: "أحمد محمد الإدارة", role: "admin" },
  { email: "teacher@demo.school",    displayName: "سارة علي المعلمة", role: "teacher" },
  { email: "student@demo.school",    displayName: "يوسف محمد الطالب", role: "student" },
];

// ─── Subjects ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { id: "subj-math",    name: "الرياضيات",          nameEn: "MATH-101",    category: "core",     weeklyHours: 5 },
  { id: "subj-sci",     name: "العلوم",              nameEn: "SCI-101",     category: "core",     weeklyHours: 4 },
  { id: "subj-arabic",  name: "اللغة العربية",       nameEn: "ARB-101",     category: "language", weeklyHours: 6 },
  { id: "subj-english", name: "اللغة الإنجليزية",   nameEn: "ENG-101",     category: "language", weeklyHours: 5 },
  { id: "subj-history", name: "التاريخ",             nameEn: "HIST-101",    category: "core",     weeklyHours: 3 },
  { id: "subj-geo",     name: "الجغرافيا",          nameEn: "GEO-101",     category: "core",     weeklyHours: 3 },
  { id: "subj-physics", name: "الفيزياء",            nameEn: "PHY-101",     category: "core",     weeklyHours: 4 },
  { id: "subj-chem",    name: "الكيمياء",            nameEn: "CHEM-101",    category: "core",     weeklyHours: 4 },
];

// ─── Teachers ─────────────────────────────────────────────────────────────────
const TEACHERS = [
  { id: "t1", name: "محمد أحمد الكريمي",   nameEn: "M. Al-Karimi",   email: "m.karimi@school.edu",   phone: "0771-111-0001", specialization: "الرياضيات",        qualification: "ماجستير", subjectIds: ["subj-math"],    classIds: ["cls-7a", "cls-7b"] },
  { id: "t2", name: "سارة علي الموسوي",    nameEn: "S. Al-Musawi",   email: "s.musawi@school.edu",   phone: "0771-111-0002", specialization: "العلوم",           qualification: "بكالوريوس", subjectIds: ["subj-sci"],     classIds: ["cls-8a"] },
  { id: "t3", name: "عمر خالد البغدادي",   nameEn: "O. Al-Baghdadi", email: "o.baghdadi@school.edu", phone: "0771-111-0003", specialization: "اللغة العربية",   qualification: "ماجستير", subjectIds: ["subj-arabic"],  classIds: ["cls-8b"] },
  { id: "t4", name: "فاطمة حسن العبيدي",   nameEn: "F. Al-Ubaidi",   email: "f.ubaidi@school.edu",   phone: "0771-111-0004", specialization: "اللغة الإنجليزية", qualification: "بكالوريوس", subjectIds: ["subj-english"], classIds: ["cls-9a"] },
  { id: "t5", name: "حسين علي الربيعي",    nameEn: "H. Al-Rubaie",   email: "h.rubaie@school.edu",   phone: "0771-111-0005", specialization: "التاريخ",          qualification: "بكالوريوس", subjectIds: ["subj-history"], classIds: ["cls-9b"] },
  { id: "t6", name: "زينب محمد الجبوري",   nameEn: "Z. Al-Jibouri",  email: "z.jibouri@school.edu",  phone: "0771-111-0006", specialization: "الجغرافيا",        qualification: "بكالوريوس", subjectIds: ["subj-geo"],     classIds: [] },
  { id: "t7", name: "كريم صالح الدليمي",   nameEn: "K. Al-Dulaimi",  email: "k.dulaimi@school.edu",  phone: "0771-111-0007", specialization: "الفيزياء",         qualification: "دكتوراه",   subjectIds: ["subj-physics"], classIds: [] },
  { id: "t8", name: "نور حامد الزبيدي",    nameEn: "N. Al-Zubaidi",  email: "n.zubaidi@school.edu",  phone: "0771-111-0008", specialization: "الكيمياء",         qualification: "ماجستير", subjectIds: ["subj-chem"],    classIds: [] },
];

// ─── Classes ─────────────────────────────────────────────────────────────────
const CLASSES = [
  { id: "cls-7a", name: "الصف السابع - شعبة أ", nameEn: "Grade 7 - Section A", grade: 7, section: "A", teacherId: "t1", teacherName: "محمد أحمد الكريمي", capacity: 35, room: "101" },
  { id: "cls-7b", name: "الصف السابع - شعبة ب", nameEn: "Grade 7 - Section B", grade: 7, section: "B", teacherId: "t2", teacherName: "سارة علي الموسوي",  capacity: 35, room: "102" },
  { id: "cls-8a", name: "الصف الثامن - شعبة أ", nameEn: "Grade 8 - Section A", grade: 8, section: "A", teacherId: "t3", teacherName: "عمر خالد البغدادي", capacity: 35, room: "103" },
  { id: "cls-8b", name: "الصف الثامن - شعبة ب", nameEn: "Grade 8 - Section B", grade: 8, section: "B", teacherId: "t4", teacherName: "فاطمة حسن العبيدي", capacity: 35, room: "104" },
  { id: "cls-9a", name: "الصف التاسع - شعبة أ", nameEn: "Grade 9 - Section A", grade: 9, section: "A", teacherId: "t5", teacherName: "حسين علي الربيعي",  capacity: 35, room: "105" },
  { id: "cls-9b", name: "الصف التاسع - شعبة ب", nameEn: "Grade 9 - Section B", grade: 9, section: "B", teacherId: "t1", teacherName: "محمد أحمد الكريمي", capacity: 35, room: "106" },
];

// ─── Students (40 across 6 classes) ─────────────────────────────────────────
const STUDENT_NAMES = [
  // cls-7a (7 students)
  { id: "s01", name: "يوسف علي محمد",      nameEn: "Y. Ali",      classId: "cls-7a", className: "الصف السابع - شعبة أ", gender: "male",   dob: "2012-03-15", guardian: "علي محمد",      guardianPhone: "0771-201-0001" },
  { id: "s02", name: "فاطمة حسن عبدالله",  nameEn: "F. Hassan",   classId: "cls-7a", className: "الصف السابع - شعبة أ", gender: "female", dob: "2012-07-22", guardian: "حسن عبدالله",   guardianPhone: "0771-201-0002" },
  { id: "s03", name: "محمد خالد إبراهيم",  nameEn: "M. Khalid",   classId: "cls-7a", className: "الصف السابع - شعبة أ", gender: "male",   dob: "2012-01-10", guardian: "خالد إبراهيم",  guardianPhone: "0771-201-0003" },
  { id: "s04", name: "زينب أحمد سليمان",   nameEn: "Z. Ahmad",    classId: "cls-7a", className: "الصف السابع - شعبة أ", gender: "female", dob: "2012-11-05", guardian: "أحمد سليمان",   guardianPhone: "0771-201-0004" },
  { id: "s05", name: "علي حسين الشمري",    nameEn: "A. Hussein",  classId: "cls-7a", className: "الصف السابع - شعبة أ", gender: "male",   dob: "2012-09-30", guardian: "حسين الشمري",   guardianPhone: "0771-201-0005" },
  { id: "s06", name: "نور محمد العبيدي",   nameEn: "N. Mohamed",  classId: "cls-7a", className: "الصف السابع - شعبة أ", gender: "female", dob: "2012-04-18", guardian: "محمد العبيدي",  guardianPhone: "0771-201-0006" },
  { id: "s07", name: "كريم صلاح الدين",    nameEn: "K. Salah",    classId: "cls-7a", className: "الصف السابع - شعبة أ", gender: "male",   dob: "2012-06-25", guardian: "صلاح الدين",    guardianPhone: "0771-201-0007" },
  // cls-7b (7 students)
  { id: "s08", name: "سارة عمر الجبوري",   nameEn: "S. Omar",     classId: "cls-7b", className: "الصف السابع - شعبة ب", gender: "female", dob: "2012-02-14", guardian: "عمر الجبوري",   guardianPhone: "0771-201-0008" },
  { id: "s09", name: "حسن ناصر الربيعي",   nameEn: "H. Nasser",   classId: "cls-7b", className: "الصف السابع - شعبة ب", gender: "male",   dob: "2012-08-09", guardian: "ناصر الربيعي",  guardianPhone: "0771-201-0009" },
  { id: "s10", name: "مريم جاسم القيسي",   nameEn: "M. Jassim",   classId: "cls-7b", className: "الصف السابع - شعبة ب", gender: "female", dob: "2012-12-03", guardian: "جاسم القيسي",   guardianPhone: "0771-201-0010" },
  { id: "s11", name: "عمر صادق المحمداوي", nameEn: "O. Sadiq",    classId: "cls-7b", className: "الصف السابع - شعبة ب", gender: "male",   dob: "2012-05-19", guardian: "صادق المحمداوي", guardianPhone: "0771-201-0011" },
  { id: "s12", name: "ريم إبراهيم الزيدي", nameEn: "R. Ibrahim",  classId: "cls-7b", className: "الصف السابع - شعبة ب", gender: "female", dob: "2012-10-27", guardian: "إبراهيم الزيدي", guardianPhone: "0771-201-0012" },
  { id: "s13", name: "أحمد طارق البياتي",  nameEn: "A. Tariq",    classId: "cls-7b", className: "الصف السابع - شعبة ب", gender: "male",   dob: "2012-01-31", guardian: "طارق البياتي",  guardianPhone: "0771-201-0013" },
  { id: "s14", name: "دانا رافع الدليمي",  nameEn: "D. Rafie",    classId: "cls-7b", className: "الصف السابع - شعبة ب", gender: "female", dob: "2012-07-07", guardian: "رافع الدليمي",  guardianPhone: "0771-201-0014" },
  // cls-8a (7 students)
  { id: "s15", name: "إبراهيم قاسم النجار", nameEn: "I. Qasim",   classId: "cls-8a", className: "الصف الثامن - شعبة أ", gender: "male",   dob: "2011-04-02", guardian: "قاسم النجار",   guardianPhone: "0771-201-0015" },
  { id: "s16", name: "هدى سعد الأنصاري",   nameEn: "H. Saad",     classId: "cls-8a", className: "الصف الثامن - شعبة أ", gender: "female", dob: "2011-09-16", guardian: "سعد الأنصاري",  guardianPhone: "0771-201-0016" },
  { id: "s17", name: "عبدالله حمد الكربلائي", nameEn: "A. Hamad", classId: "cls-8a", className: "الصف الثامن - شعبة أ", gender: "male",   dob: "2011-11-23", guardian: "حمد الكربلائي", guardianPhone: "0771-201-0017" },
  { id: "s18", name: "ليلى ياسر التميمي",  nameEn: "L. Yasser",   classId: "cls-8a", className: "الصف الثامن - شعبة أ", gender: "female", dob: "2011-02-08", guardian: "ياسر التميمي",  guardianPhone: "0771-201-0018" },
  { id: "s19", name: "بلال حيدر الكعبي",   nameEn: "B. Haider",   classId: "cls-8a", className: "الصف الثامن - شعبة أ", gender: "male",   dob: "2011-06-14", guardian: "حيدر الكعبي",   guardianPhone: "0771-201-0019" },
  { id: "s20", name: "آيات فؤاد النعيمي",  nameEn: "A. Fouad",    classId: "cls-8a", className: "الصف الثامن - شعبة أ", gender: "female", dob: "2011-08-29", guardian: "فؤاد النعيمي",  guardianPhone: "0771-201-0020" },
  { id: "s21", name: "رائد عبدالكريم سعيد", nameEn: "R. Abdel",   classId: "cls-8a", className: "الصف الثامن - شعبة أ", gender: "male",   dob: "2011-03-21", guardian: "عبدالكريم سعيد", guardianPhone: "0771-201-0021" },
  // cls-8b (7 students)
  { id: "s22", name: "تسنيم جمال العطار",   nameEn: "T. Jamal",   classId: "cls-8b", className: "الصف الثامن - شعبة ب", gender: "female", dob: "2011-05-12", guardian: "جمال العطار",   guardianPhone: "0771-201-0022" },
  { id: "s23", name: "سيف الدين مازن القادر", nameEn: "S. Mazen",  classId: "cls-8b", className: "الصف الثامن - شعبة ب", gender: "male",   dob: "2011-10-03", guardian: "مازن القادر",   guardianPhone: "0771-201-0023" },
  { id: "s24", name: "رنا لؤي الشيخلي",    nameEn: "R. Louay",    classId: "cls-8b", className: "الصف الثامن - شعبة ب", gender: "female", dob: "2011-12-18", guardian: "لؤي الشيخلي",   guardianPhone: "0771-201-0024" },
  { id: "s25", name: "حمزة فارس الجنابي",  nameEn: "H. Faris",    classId: "cls-8b", className: "الصف الثامن - شعبة ب", gender: "male",   dob: "2011-01-26", guardian: "فارس الجنابي",  guardianPhone: "0771-201-0025" },
  { id: "s26", name: "إيمان هادي السامرائي", nameEn: "I. Hadi",   classId: "cls-8b", className: "الصف الثامن - شعبة ب", gender: "female", dob: "2011-07-09", guardian: "هادي السامرائي", guardianPhone: "0771-201-0026" },
  { id: "s27", name: "أنس رعد الكناني",    nameEn: "A. Raad",     classId: "cls-8b", className: "الصف الثامن - شعبة ب", gender: "male",   dob: "2011-09-04", guardian: "رعد الكناني",   guardianPhone: "0771-201-0027" },
  { id: "s28", name: "شيماء عدنان البدري",  nameEn: "Sh. Adnan",   classId: "cls-8b", className: "الصف الثامن - شعبة ب", gender: "female", dob: "2011-04-17", guardian: "عدنان البدري",  guardianPhone: "0771-201-0028" },
  // cls-9a (6 students)
  { id: "s29", name: "ماجد ثامر السلطاني",  nameEn: "M. Thamer",   classId: "cls-9a", className: "الصف التاسع - شعبة أ", gender: "male",   dob: "2010-06-01", guardian: "ثامر السلطاني",  guardianPhone: "0771-201-0029" },
  { id: "s30", name: "وفاء كاظم الموسوي",  nameEn: "W. Kadhim",   classId: "cls-9a", className: "الصف التاسع - شعبة أ", gender: "female", dob: "2010-11-14", guardian: "كاظم الموسوي",  guardianPhone: "0771-201-0030" },
  { id: "s31", name: "ثائر سامي العامري",   nameEn: "Th. Sami",    classId: "cls-9a", className: "الصف التاسع - شعبة أ", gender: "male",   dob: "2010-03-28", guardian: "سامي العامري",  guardianPhone: "0771-201-0031" },
  { id: "s32", name: "غزل محمود الجميلي",  nameEn: "G. Mahmoud",  classId: "cls-9a", className: "الصف التاسع - شعبة أ", gender: "female", dob: "2010-08-07", guardian: "محمود الجميلي",  guardianPhone: "0771-201-0032" },
  { id: "s33", name: "وسام عصام العزاوي",  nameEn: "W. Essam",    classId: "cls-9a", className: "الصف التاسع - شعبة أ", gender: "male",   dob: "2010-02-19", guardian: "عصام العزاوي",  guardianPhone: "0771-201-0033" },
  { id: "s34", name: "تغريد نزار المنصوري", nameEn: "T. Nizar",   classId: "cls-9a", className: "الصف التاسع - شعبة أ", gender: "female", dob: "2010-12-30", guardian: "نزار المنصوري", guardianPhone: "0771-201-0034" },
  // cls-9b (6 students)
  { id: "s35", name: "زياد باسل الصافي",   nameEn: "Z. Bassil",   classId: "cls-9b", className: "الصف التاسع - شعبة ب", gender: "male",   dob: "2010-05-11", guardian: "باسل الصافي",   guardianPhone: "0771-201-0035" },
  { id: "s36", name: "ندى وليد الراوي",    nameEn: "N. Walid",    classId: "cls-9b", className: "الصف التاسع - شعبة ب", gender: "female", dob: "2010-09-24", guardian: "وليد الراوي",    guardianPhone: "0771-201-0036" },
  { id: "s37", name: "أسامة يحيى البصري",  nameEn: "O. Yahya",    classId: "cls-9b", className: "الصف التاسع - شعبة ب", gender: "male",   dob: "2010-01-16", guardian: "يحيى البصري",   guardianPhone: "0771-201-0037" },
  { id: "s38", name: "إسراء تحسين الكوفي", nameEn: "I. Tahsin",   classId: "cls-9b", className: "الصف التاسع - شعبة ب", gender: "female", dob: "2010-07-03", guardian: "تحسين الكوفي",  guardianPhone: "0771-201-0038" },
  { id: "s39", name: "مالك شاكر العكيلي",  nameEn: "M. Shaker",   classId: "cls-9b", className: "الصف التاسع - شعبة ب", gender: "male",   dob: "2010-04-22", guardian: "شاكر العكيلي",  guardianPhone: "0771-201-0039" },
  { id: "s40", name: "شذى قيس النعماني",   nameEn: "Sh. Qais",    classId: "cls-9b", className: "الصف التاسع - شعبة ب", gender: "female", dob: "2010-10-08", guardian: "قيس النعماني",  guardianPhone: "0771-201-0040" },
];

// ─── Attendance (last 10 school days) ────────────────────────────────────────
function getLastNSchoolDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  while (days.length < n) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 5 && day !== 6) { // skip Friday (5) & Saturday (6)
      days.push(d.toISOString().split("T")[0]);
    }
  }
  return days;
}

type AttStatus = "present" | "absent" | "late" | "excused";
function randomStatus(): AttStatus {
  const r = Math.random();
  if (r < 0.82) return "present";
  if (r < 0.90) return "absent";
  if (r < 0.96) return "late";
  return "excused";
}

function buildAttendanceRecords() {
  const days = getLastNSchoolDays(10);
  const records: Array<{ id: string; data: Record<string, unknown> }> = [];
  for (const student of STUDENT_NAMES) {
    for (const date of days) {
      const status = randomStatus();
      records.push({
        id: `${student.id}_${date}`,
        data: {
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          date,
          status,
          academicYear: YEAR,
          recordedBy: "seed",
          notes: "",
        },
      });
    }
  }
  return records;
}

// ─── Grades (all students × 4 subjects × first term) ─────────────────────────
const GRADED_SUBJECTS = ["subj-math", "subj-sci", "subj-arabic", "subj-english"];
const SUBJECT_NAMES: Record<string, string> = {
  "subj-math": "الرياضيات",
  "subj-sci": "العلوم",
  "subj-arabic": "اللغة العربية",
  "subj-english": "اللغة الإنجليزية",
};

function randomScore(min = 40, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildGradeRecords() {
  const records: Array<{ id: string; data: Record<string, unknown> }> = [];
  for (const student of STUDENT_NAMES) {
    for (const subjectId of GRADED_SUBJECTS) {
      for (const term of ["first", "second"] as const) {
        // some students score lower, some higher — realistic distribution
        const base = Math.random() < 0.15 ? randomScore(30, 55) : randomScore(55, 98);
        records.push({
          id: `${student.id}_${subjectId}_${term}_${YEAR}`,
          data: {
            studentId: student.id,
            studentName: student.name,
            subjectId,
            subjectName: SUBJECT_NAMES[subjectId],
            classId: student.classId,
            term,
            score: base,
            maxScore: 100,
            academicYear: YEAR,
            recordedBy: "seed",
          },
        });
      }
    }
  }
  return records;
}

// ─── Fees ─────────────────────────────────────────────────────────────────────
function buildFeeRecords() {
  const records: Array<{ id: string; data: Record<string, unknown> }> = [];
  const feeTypes = ["tuition", "uniform", "activity"];
  let idx = 0;
  for (const student of STUDENT_NAMES) {
    const feeType = feeTypes[idx % 3];
    const amount = feeType === "tuition" ? 350000 : feeType === "uniform" ? 75000 : 50000;
    const rand = Math.random();
    const status = rand < 0.55 ? "paid" : rand < 0.75 ? "unpaid" : "partial";
    const dueDate = `2025-${String(10 + (idx % 3)).padStart(2, "0")}-01`;
    records.push({
      id: `fee-${student.id}-${feeType}`,
      data: {
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        amount,
        type: feeType,
        status,
        dueDate,
        paidAt: status === "paid" ? new Date().toISOString() : null,
        paidAmount: status === "partial" ? Math.floor(amount * 0.5) : (status === "paid" ? amount : 0),
        paymentMethod: status !== "unpaid" ? "cash" : "",
        receiptNumber: status !== "unpaid" ? `RCP-${1000 + idx}` : "",
        notes: "",
        academicYear: YEAR,
      },
    });
    idx++;
  }
  return records;
}

// ─── Announcements ─────────────────────────────────────────────────────────────
const ANNOUNCEMENTS = [
  {
    id: "ann-001",
    title: "موعد الامتحانات النهائية للفصل الأول",
    titleEn: "First Term Final Exams Schedule",
    body: "تُعقد امتحانات الفصل الأول خلال الفترة من 15 إلى 25 ديسمبر 2025. يُرجى الاستعداد الجيد والمراجعة المبكرة للمواد الدراسية.",
    bodyEn: "Final exams for the first term will be held from December 15 to 25, 2025. Please study well in advance.",
    targetRole: "all",
    priority: "urgent",
    pinned: true,
  },
  {
    id: "ann-002",
    title: "اجتماع أولياء الأمور الشهري",
    titleEn: "Monthly Parents Meeting",
    body: "يُعقد الاجتماع الشهري لأولياء الأمور يوم السبت القادم الساعة العاشرة صباحاً في قاعة الاجتماعات الكبرى.",
    bodyEn: "The monthly parents meeting will be held next Saturday at 10:00 AM in the main hall.",
    targetRole: "all",
    priority: "normal",
    pinned: false,
  },
  {
    id: "ann-003",
    title: "تحديث خطط الدروس للمعلمين",
    titleEn: "Updated Lesson Plans — Teachers",
    body: "نُذكّر المعلمين الكرام بضرورة تسليم خطط دروس الفصل الثاني بحلول الأول من يناير 2026.",
    bodyEn: "Reminder to all teachers to submit second-term lesson plans by January 1st, 2026.",
    targetRole: "teacher",
    priority: "normal",
    pinned: false,
  },
  {
    id: "ann-004",
    title: "رحلة تعليمية لطلاب الصف الثامن",
    titleEn: "Educational Trip — Grade 8",
    body: "ستنظم المدرسة رحلة تعليمية لطلاب الصف الثامن إلى المتحف الوطني بتاريخ 10 نوفمبر 2025.",
    bodyEn: "The school is organizing an educational trip to the National Museum for Grade 8 students on November 10, 2025.",
    targetRole: "student",
    priority: "info",
    pinned: false,
  },
  {
    id: "ann-005",
    title: "عطلة رأس السنة الهجرية",
    titleEn: "Islamic New Year Holiday",
    body: "تُحدّد إدارة المدرسة يوم الإثنين القادم عطلة رسمية بمناسبة رأس السنة الهجرية الجديدة. يعود الطلاب والمعلمون يوم الثلاثاء.",
    bodyEn: "Next Monday is declared an official school holiday for the Islamic New Year. Students and teachers return on Tuesday.",
    targetRole: "all",
    priority: "info",
    pinned: false,
  },
];

// ─── Main Seed Function ────────────────────────────────────────────────────────

export async function seedDemoData(onProgress: (msg: string) => void): Promise<void> {
  onProgress("🏫 Creating demo school...");

  // 1. School document
  await setDoc(doc(db, "schools", SCHOOL_ID), {
    name: "مدرسة النموذج الابتدائية",
    nameAr: "مدرسة النموذج الابتدائية",
    plan: "pro",
    ownerUid: "seed",
    createdAt: serverTimestamp(),
  });

  // 2. Create Firebase Auth users via a secondary app instance
  //    Using a secondary app prevents Firebase from signing out the currently
  //    logged-in admin and switching to each newly created demo account.
  onProgress("👥 Creating demo user accounts (using secondary auth instance)...");

  const secondaryAppConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  };

  // Use a unique name so we don't clash with the default app
  const secondaryApp = initApp(secondaryAppConfig, `seed-helper-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  try {
    for (const u of DEMO_USERS) {
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, u.email, PASSWORD);
        await updateProfile(cred.user, { displayName: u.displayName });
        await setDoc(doc(secondaryDb, "users", cred.user.uid), {
          uid: cred.user.uid,
          email: u.email,
          displayName: u.displayName,
          schoolId: SCHOOL_ID,
          role: u.role,
          createdAt: serverTimestamp(),
        });
        onProgress(`  ✓ Created ${u.role}: ${u.email}`);
      } catch (err: unknown) {
        // If user already exists, skip (idempotent)
        if (err instanceof Error && err.message?.includes("email-already-in-use")) {
          onProgress(`  ⚠ User already exists: ${u.email} (skipped)`);
        } else {
          throw err;
        }
      }
    }
  } finally {
    // Always clean up the secondary app when done, whether it succeeded or failed
    await deleteApp(secondaryApp);
  }

  // 3. Subjects
  onProgress("📚 Seeding subjects...");
  {
    const batch = writeBatch(db);
    for (const s of SUBJECTS) {
      const ref = doc(db, "schools", SCHOOL_ID, "subjects", s.id);
      batch.set(ref, { ...s, schoolId: SCHOOL_ID, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }

  // 4. Teachers
  onProgress("👨‍🏫 Seeding teachers...");
  {
    const batch = writeBatch(db);
    for (const t of TEACHERS) {
      const ref = doc(db, "schools", SCHOOL_ID, "teachers", t.id);
      batch.set(ref, {
        ...t,
        status: "active",
        joinDate: "2020-09-01",
        schoolId: SCHOOL_ID,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  // 5. Classes
  onProgress("🏫 Seeding classes...");
  {
    const batch = writeBatch(db);
    for (const c of CLASSES) {
      const ref = doc(db, "schools", SCHOOL_ID, "classes", c.id);
      batch.set(ref, { ...c, academicYear: YEAR, schoolId: SCHOOL_ID, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }

  // 6. Students
  onProgress("👩‍🎓 Seeding 40 students...");
  {
    const batch = writeBatch(db);
    for (const s of STUDENT_NAMES) {
      const ref = doc(db, "schools", SCHOOL_ID, "students", s.id);
      batch.set(ref, {
        id: s.id,
        name: s.name,
        nameEn: s.nameEn,
        classId: s.classId,
        className: s.className,
        gender: s.gender,
        dateOfBirth: s.dob,
        guardianName: s.guardian,
        guardianPhone: s.guardianPhone,
        enrollmentYear: YEAR,
        schoolId: SCHOOL_ID,
        notes: "",
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  // 7. Attendance
  onProgress("✅ Seeding attendance records (~400 records)...");
  {
    const records = buildAttendanceRecords();
    // Split into batches of 499
    const chunks: typeof records[] = [];
    for (let i = 0; i < records.length; i += 499) chunks.push(records.slice(i, i + 499));
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const { id, data } of chunk) {
        const ref = doc(db, "schools", SCHOOL_ID, "attendance", id);
        batch.set(ref, { ...data, schoolId: SCHOOL_ID }, { merge: true });
      }
      await batch.commit();
    }
  }

  // 8. Grades
  onProgress("📝 Seeding grade records (~320 records)...");
  {
    const records = buildGradeRecords();
    const chunks: typeof records[] = [];
    for (let i = 0; i < records.length; i += 499) chunks.push(records.slice(i, i + 499));
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const { id, data } of chunk) {
        const ref = doc(db, "schools", SCHOOL_ID, "grades", id);
        batch.set(ref, { ...data, schoolId: SCHOOL_ID }, { merge: true });
      }
      await batch.commit();
    }
  }

  // 9. Fees
  onProgress("💰 Seeding fee records...");
  {
    const records = buildFeeRecords();
    const batch = writeBatch(db);
    for (const { id, data } of records) {
      const ref = doc(db, "schools", SCHOOL_ID, "fees", id);
      batch.set(ref, { ...data, schoolId: SCHOOL_ID, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }

  // 10. Announcements
  onProgress("📣 Seeding announcements...");
  {
    const batch = writeBatch(db);
    for (const ann of ANNOUNCEMENTS) {
      const ref = doc(db, "schools", SCHOOL_ID, "announcements", ann.id);
      batch.set(ref, {
        ...ann,
        createdBy: "seed",
        createdByName: "النظام",
        academicYear: YEAR,
        schoolId: SCHOOL_ID,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  onProgress("🎉 All done! Seed data created successfully.");
  onProgress(`\n📋 Demo Accounts:\n  superadmin@demo.school / Demo@12345\n  admin@demo.school / Demo@12345\n  teacher@demo.school / Demo@12345\n  student@demo.school / Demo@12345`);
  onProgress(`\n🏫 School ID: ${SCHOOL_ID}`);
}
