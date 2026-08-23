/**
 * Bilingual translation system — Arabic + English.
 * Usage:  const { t, lang, setLang } = useTranslation();
 *         <h1>{t("students")}</h1>
 */

import { createContext, useContext, useState, type ReactNode, createElement, useEffect } from 'react';

export type Lang = "ar" | "en";

// ─── Translation dictionary ───────────────────────────────────────────────────
const translations: Record<string, Record<Lang, string>> = {
  // ── Navigation ──
  overview:          { ar: "نظرة عامة",          en: "Overview" },
  classes:           { ar: "الصفوف الدراسية",    en: "Classes" },
  subjects:          { ar: "المواد الدراسية",    en: "Subjects" },
  teachers:          { ar: "المعلمون",            en: "Teachers" },
  students:          { ar: "الطلاب",              en: "Students" },
  attendance:        { ar: "الحضور والغياب",      en: "Attendance" },
  grades:            { ar: "الدرجات والنتائج",   en: "Grades & Results" },
  fees:              { ar: "الرسوم الدراسية",    en: "School Fees" },
  announcements:     { ar: "الإعلانات",          en: "Announcements" },
  theme:             { ar: "المظهر",             en: "Theme" },
  darkMode:          { ar: "الوضع الداكن",       en: "Dark Mode" },
  lightMode:         { ar: "الوضع الفاتح",       en: "Light Mode" },
  toggleTheme:       { ar: "تبديل المظهر",       en: "Toggle Theme" },

  // ── Overview ──
  welcomeBack:       { ar: "أهلاً بعودتك،",     en: "Welcome back," },
  totalStudents:     { ar: "إجمالي الطلاب",      en: "Total Students" },
  totalTeachers:     { ar: "إجمالي المعلمين",   en: "Total Teachers" },
  totalClasses:      { ar: "الصفوف الدراسية",   en: "Classes" },
  feesCollected:     { ar: "الرسوم المحصّلة",   en: "Fees Collected" },
  recentAnnouncements: { ar: "الإعلانات الأخيرة", en: "Recent Announcements" },
  todayAttendance:   { ar: "حضور اليوم",         en: "Today's Attendance" },
  noAnnouncements:   { ar: "لا توجد إعلانات",    en: "No announcements yet" },
  noAttendance:      { ar: "لا يوجد سجل حضور",  en: "No attendance recorded yet" },
  quickActions:      { ar: "إجراءات سريعة",      en: "Quick Actions" },
  recordAttendance:  { ar: "تسجيل الحضور",       en: "Record Attendance" },
  addStudent:        { ar: "إضافة طالب",         en: "Add Student" },
  publishAnnouncement: { ar: "نشر إعلان",        en: "Publish Announcement" },
  gradeDistribution: { ar: "توزيع الدرجات",      en: "Grade Distribution" },
  monthlyRevenue:    { ar: "الإيرادات الشهرية",  en: "Monthly Revenue" },
  attendanceTrend:   { ar: "مؤشر الحضور",       en: "Attendance Trend" },
  topStudents:       { ar: "أفضل الطلاب",        en: "Top Students" },
  overdueFeesAlert:  { ar: "رسوم متأخرة",        en: "Overdue Fees Alert" },
  studentsWithOverdue: { ar: "طلاب بمدفوعات متأخرة", en: "students with overdue fees" },
  pass:              { ar: "ناجح",               en: "Pass" },
  fail:              { ar: "راسب",               en: "Fail" },
  averageScore:      { ar: "المعدل العام",       en: "Avg Score" },

  // ── Students ──
  enrolledStudents:  { ar: "الطلاب المسجلون",   en: "Enrolled Students" },
  search:            { ar: "بحث...",             en: "Search..." },
  searchStudents:    { ar: "ابحث عن طالب...",   en: "Search students..." },
  allClasses:        { ar: "جميع الصفوف",        en: "All Classes" },
  allGenders:        { ar: "الجنسان",            en: "All Genders" },
  male:              { ar: "ذكر",                en: "Male" },
  female:            { ar: "أنثى",              en: "Female" },
  name:              { ar: "الاسم",              en: "Name" },
  class:             { ar: "الصف",               en: "Class" },
  gender:            { ar: "الجنس",              en: "Gender" },
  guardian:          { ar: "ولي الأمر",          en: "Guardian" },
  phone:             { ar: "رقم الهاتف",         en: "Phone" },
  actions:           { ar: "الإجراءات",          en: "Actions" },
  edit:              { ar: "تعديل",              en: "Edit" },
  delete:            { ar: "حذف",               en: "Delete" },
  view:              { ar: "عرض",               en: "View" },
  noStudentsFound:   { ar: "لا يوجد طلاب",      en: "No students found" },
  addStudentBtn:     { ar: "+ إضافة طالب",      en: "+ Add Student" },
  fullName:          { ar: "الاسم الكامل",       en: "Full Name" },
  secondaryName:     { ar: "الاسم الثانوي",      en: "Secondary Name" },
  dateOfBirth:       { ar: "تاريخ الميلاد",      en: "Date of Birth" },
  age:               { ar: "العمر",              en: "Age" },
  guardianName:      { ar: "اسم ولي الأمر",      en: "Guardian Name" },
  guardianPhone:     { ar: "هاتف ولي الأمر",     en: "Guardian Phone" },
  saveStudent:       { ar: "حفظ الطالب",        en: "Save Student" },
  editStudent:       { ar: "تعديل الطالب",      en: "Edit Student" },
  cancel:            { ar: "إلغاء",             en: "Cancel" },
  saving:            { ar: "جارٍ الحفظ...",      en: "Saving..." },
  loading:           { ar: "جارٍ التحميل...",    en: "Loading..." },
  exportExcel:       { ar: "تصدير Excel",        en: "Export Excel" },

  // ── Teachers ──
  facultyMembers:    { ar: "أعضاء الهيئة التدريسية", en: "Faculty Members" },
  addTeacher:        { ar: "+ إضافة معلم",      en: "+ Add Teacher" },
  email:             { ar: "البريد الإلكتروني",  en: "Email" },
  qualification:     { ar: "المؤهل العلمي",      en: "Qualification" },
  specialization:    { ar: "التخصص",             en: "Specialization" },
  joinDate:          { ar: "تاريخ الانضمام",     en: "Join Date" },
  status:            { ar: "الحالة",             en: "Status" },
  active:            { ar: "نشط",               en: "Active" },
  onLeave:           { ar: "إجازة",             en: "On Leave" },
  resigned:          { ar: "مستقيل",            en: "Resigned" },
  saveTeacher:       { ar: "حفظ المعلم",        en: "Save Teacher" },
  editTeacher:       { ar: "تعديل المعلم",      en: "Edit Teacher" },
  assigned:          { ar: "معيّن",             en: "Assigned" },
  unassigned:        { ar: "غير معيّن",         en: "Unassigned" },
  assignSubjects:    { ar: "تعيين المواد",       en: "Assign Subjects" },
  assignClasses:     { ar: "تعيين الصفوف",      en: "Assign Classes" },
  searchTeachers:    { ar: "ابحث عن معلم...",   en: "Search teachers..." },
  noTeachersFound:   { ar: "لا يوجد معلمون",    en: "No teachers found" },

  // ── Classes ──
  academicYear:      { ar: "العام الدراسي",      en: "Academic Year" },
  grade:             { ar: "المرحلة",            en: "Grade" },
  section:           { ar: "الشعبة",             en: "Section" },
  homeroomTeacher:   { ar: "المعلم المشرف",      en: "Homeroom Teacher" },
  studentCount:      { ar: "عدد الطلاب",        en: "Students" },
  capacity:          { ar: "الطاقة الاستيعابية", en: "Capacity" },
  room:              { ar: "رقم الغرفة",         en: "Room" },
  className:         { ar: "اسم الصف",           en: "Class Name" },
  addClass:          { ar: "+ إضافة صف",        en: "+ Add Class" },
  editClass:         { ar: "تعديل الصف",        en: "Edit Class" },
  saveClass:         { ar: "حفظ الصف",          en: "Save Class" },
  noClassesFound:    { ar: "لا توجد صفوف",      en: "No classes found" },

  // ── Subjects ──
  courseCatalog:     { ar: "دليل المواد الدراسية", en: "Course Catalog" },
  addSubject:        { ar: "+ إضافة مادة",      en: "+ Add Subject" },
  subjectName:       { ar: "اسم المادة",        en: "Subject Name" },
  subjectCode:       { ar: "كود المادة",        en: "Subject Code" },
  category:          { ar: "التصنيف",            en: "Category" },
  core:              { ar: "أساسية",            en: "Core" },
  elective:          { ar: "اختيارية",          en: "Elective" },
  language:          { ar: "لغوية",             en: "Language" },
  weeklyHours:       { ar: "الحصص الأسبوعية",   en: "Weekly Hours" },
  editSubject:       { ar: "تعديل المادة",      en: "Edit Subject" },
  saveSubject:       { ar: "حفظ المادة",        en: "Save Subject" },
  noSubjectsFound:   { ar: "لا توجد مواد",      en: "No subjects found" },

  // ── Attendance ──
  dailyRegister:     { ar: "سجل الحضور اليومي", en: "Daily Attendance Register" },
  present:           { ar: "حاضر",              en: "Present" },
  absent:            { ar: "غائب",              en: "Absent" },
  late:              { ar: "متأخر",             en: "Late" },
  excused:           { ar: "بعذر",              en: "Excused" },
  selectClass:       { ar: "اختر الصف",         en: "Select Class" },
  selectDate:        { ar: "اختر التاريخ",       en: "Select Date" },
  saveAttendance:    { ar: "حفظ الحضور",        en: "Save Attendance" },
  markAllPresent:    { ar: "تعيين الكل حاضر",   en: "Mark All Present" },
  savedSuccessfully: { ar: "✓ تم الحفظ بنجاح", en: "✓ Saved successfully" },
  noStudentsInClass: { ar: "لا يوجد طلاب في هذا الصف", en: "No students in this class" },
  selectClassFirst:  { ar: "اختر صفاً لبدء تسجيل الحضور", en: "Select a class to start recording attendance" },
  attendanceHistory: { ar: "سجل الحضور",        en: "Attendance History" },
  todayRegister:     { ar: "سجل اليوم",         en: "Today's Register" },
  notes:             { ar: "ملاحظات",           en: "Notes" },
  exportRegister:    { ar: "تصدير السجل",       en: "Export Register" },

  // ── Grades ──
  gradesResults:     { ar: "الدرجات والنتائج",  en: "Grades & Results" },
  firstTerm:         { ar: "الفصل الأول",       en: "First Term" },
  secondTerm:        { ar: "الفصل الثاني",      en: "Second Term" },
  finalExam:         { ar: "الامتحان النهائي",  en: "Final Exam" },
  term:              { ar: "الفصل",             en: "Term" },
  score:             { ar: "الدرجة",            en: "Score" },
  percentage:        { ar: "النسبة",            en: "%" },
  result:            { ar: "النتيجة",           en: "Result" },
  highest:           { ar: "الأعلى",           en: "Highest" },
  lowest:            { ar: "الأدنى",            en: "Lowest" },
  average:           { ar: "المعدل",            en: "Average" },
  saveGrades:        { ar: "حفظ الدرجات",       en: "Save Grades" },
  gradesSaved:       { ar: "✓ تم حفظ الدرجات بنجاح", en: "✓ Grades saved successfully" },
  selectClassAndSubject: { ar: "اختر الصف والمادة", en: "Select class and subject" },
  exportGrades:      { ar: "تصدير الدرجات",     en: "Export Grades" },
  classStatistics:   { ar: "إحصاءات الصف",     en: "Class Statistics" },
  letterGrade:       { ar: "التقدير",           en: "Grade" },

  // ── Fees ──
  schoolFees:        { ar: "الرسوم الدراسية",   en: "School Fees" },
  addFeeRecord:      { ar: "+ إضافة سجل رسوم", en: "+ Add Fee Record" },
  totalBilled:       { ar: "إجمالي المطلوب",    en: "Total Billed" },
  totalCollected:    { ar: "إجمالي المحصّل",    en: "Total Collected" },
  outstanding:       { ar: "المتبقي",           en: "Outstanding" },
  overdue:           { ar: "متأخر",             en: "Overdue" },
  student:           { ar: "الطالب",            en: "Student" },
  feeType:           { ar: "نوع الرسوم",        en: "Fee Type" },
  amount:            { ar: "المبلغ",             en: "Amount" },
  dueDate:           { ar: "تاريخ الاستحقاق",   en: "Due Date" },
  paymentStatus:     { ar: "حالة الدفع",        en: "Status" },
  paid:              { ar: "مدفوع",             en: "Paid" },
  unpaid:            { ar: "غير مدفوع",         en: "Unpaid" },
  partial:           { ar: "جزئي",              en: "Partial" },
  tuition:           { ar: "الرسوم الدراسية",   en: "Tuition Fee" },
  uniform:           { ar: "الزي المدرسي",      en: "Uniform" },
  activity:          { ar: "الأنشطة والرحلات",  en: "Activities & Trips" },
  other:             { ar: "رسوم أخرى",         en: "Other Fees" },
  saveFee:           { ar: "حفظ السجل",         en: "Save Record" },
  editFee:           { ar: "تعديل السجل",       en: "Edit Record" },
  noFeesFound:       { ar: "لا توجد سجلات رسوم", en: "No fee records found" },
  paymentMethod:     { ar: "طريقة الدفع",       en: "Payment Method" },
  cash:              { ar: "نقداً",             en: "Cash" },
  bankTransfer:      { ar: "تحويل بنكي",        en: "Bank Transfer" },
  card:              { ar: "بطاقة ائتمانية",    en: "Card" },
  receiptNumber:     { ar: "رقم الإيصال",       en: "Receipt No." },
  showOverdueOnly:   { ar: "المتأخر فقط",       en: "Overdue Only" },
  allStatuses:       { ar: "كل الحالات",        en: "All Statuses" },
  exportFees:        { ar: "تصدير الرسوم",       en: "Export Fees" },
  bulkFees:          { ar: "رسوم جماعية",        en: "Bulk Fees" },
  collectionRate:    { ar: "نسبة التحصيل",      en: "Collection Rate" },
  feesByType:        { ar: "الرسوم حسب النوع",  en: "Fees by Type" },

  // ── Announcements ──
  schoolNotices:     { ar: "الإعلانات والنشرات المدرسية", en: "School Notices & Bulletins" },
  newAnnouncement:   { ar: "+ إعلان جديد",      en: "+ New Announcement" },
  priority:          { ar: "الأولوية",          en: "Priority" },
  urgent:            { ar: "عاجل",              en: "Urgent" },
  normal:            { ar: "عادي",              en: "Normal" },
  info:              { ar: "معلومة",            en: "Info" },
  pinned:            { ar: "مثبّت",             en: "Pinned" },
  pin:               { ar: "تثبيت",            en: "Pin" },
  unpin:             { ar: "إلغاء التثبيت",    en: "Unpin" },
  targetAudience:    { ar: "الجمهور المستهدف",  en: "Target Audience" },
  all_target:        { ar: "الكل",              en: "Everyone" },
  teachersOnly:      { ar: "المعلمون فقط",      en: "Teachers Only" },
  studentsParents:   { ar: "الطلاب وأولياء الأمور", en: "Students & Parents" },
  title:             { ar: "العنوان",           en: "Title" },
  body:              { ar: "النص",              en: "Body" },
  postedBy:          { ar: "نشره:",             en: "Posted by:" },
  publishAnn:        { ar: "نشر الإعلان",       en: "Publish Announcement" },
  publishing:        { ar: "جارٍ النشر...",     en: "Publishing..." },
  editAnnouncement:  { ar: "تعديل الإعلان",     en: "Edit Announcement" },
  archived:          { ar: "الأرشيف",           en: "Archived" },
  searchAnnouncements: { ar: "ابحث عن إعلان...", en: "Search announcements..." },
  noAnnouncementsFound: { ar: "لا توجد إعلانات", en: "No announcements found" },
  expiresAt:         { ar: "تنتهي في",          en: "Expires" },

  // ── Auth ──
  signIn:            { ar: "تسجيل الدخول",                        en: "Sign In" },
  signOut:           { ar: "تسجيل الخروج",                        en: "Sign Out" },
  signUp:            { ar: "إنشاء حساب",                          en: "Sign Up" },
  emailLabel:        { ar: "البريد الإلكتروني",                    en: "Email" },
  password:          { ar: "كلمة المرور",                          en: "Password" },
  signingIn:         { ar: "جارٍ تسجيل الدخول…",                  en: "Signing in…" },
  loginError:        { ar: "البريد أو كلمة المرور غير صحيحة",     en: "Invalid email or password. Please try again." },
  welcomeBackLogin:  { ar: "مرحباً بعودتك",                       en: "Welcome back" },
  signInSubtitle:    { ar: "سجّل الدخول إلى حساب مدرستك",         en: "Sign in to your school account" },
  newSchool:         { ar: "مدرسة جديدة؟",                         en: "New school?" },
  registerSchool:    { ar: "سجّل مدرستك",                          en: "Register your school" },
  schoolPlatform:    { ar: "منصة إدارة المدارس",                   en: "School Management Platform" },

  // ── Student Profile ──
  studentProfile:    { ar: "ملف الطالب",        en: "Student Profile" },
  personalInfo:      { ar: "المعلومات الشخصية", en: "Personal Information" },
  academicSummary:   { ar: "الملخص الأكاديمي",  en: "Academic Summary" },
  attendanceSummary: { ar: "ملخص الحضور",       en: "Attendance Summary" },
  feeHistory:        { ar: "سجل الرسوم",        en: "Fee History" },
  gradesBySubject:   { ar: "الدرجات حسب المادة", en: "Grades by Subject" },
  backToStudents:    { ar: "العودة للطلاب",     en: "Back to Students" },

  // ── Roles ──
  superadmin:        { ar: "مدير عام",          en: "Super Admin" },
  admin:             { ar: "مدير مدرسة",        en: "Admin" },
  teacher:           { ar: "معلم",              en: "Teacher" },
  student_role:      { ar: "طالب",              en: "Student" },
  accessDenied:      { ar: "وصول مرفوض",       en: "Access Denied" },
  noPermission:      { ar: "ليس لديك صلاحية لعرض هذه الصفحة", en: "You don't have permission to view this page" },

  // ── Seed ──
  seedData:          { ar: "بيانات تجريبية",    en: "Seed Demo Data" },
  seedDescription:   { ar: "يضيف بيانات تجريبية كاملة للمدرسة وأربعة مستخدمين", en: "Creates a demo school with 4 users and full fake data" },
  seedButton:        { ar: "🚀 إنشاء البيانات التجريبية", en: "🚀 Create Demo Data" },
  seeding:           { ar: "جارٍ إنشاء البيانات...", en: "Creating demo data..." },
  seedSuccess:       { ar: "✅ تم إنشاء البيانات بنجاح!", en: "✅ Demo data created successfully!" },
  seedError:         { ar: "❌ حدث خطأ أثناء الإنشاء", en: "❌ Error creating seed data" },

  // ── General ──
  yes:               { ar: "نعم",               en: "Yes" },
  no:                { ar: "لا",                en: "No" },
  save:              { ar: "حفظ",               en: "Save" },
  close:             { ar: "إغلاق",             en: "Close" },
  confirm:           { ar: "تأكيد",             en: "Confirm" },
  description:       { ar: "الوصف",             en: "Description" },
  optional:          { ar: "اختياري",           en: "Optional" },
  required:          { ar: "مطلوب",             en: "Required" },
  tableView:         { ar: "عرض جدولي",         en: "Table View" },
  cardView:          { ar: "عرض البطاقات",      en: "Card View" },
  noData:            { ar: "لا توجد بيانات",    en: "No data available" },
  refresh:           { ar: "تحديث",             en: "Refresh" },
  year:              { ar: "سنة",               en: "yr" },
  years:             { ar: "سنوات",             en: "yrs" },
  days:              { ar: "أيام",              en: "days" },
  logout:            { ar: "تسجيل الخروج",      en: "Sign Out" },
  viewAll:           { ar: "عرض الكل",          en: "View All" },
  assign:            { ar: "تعيين",             en: "Assign" },

  // ── Overview extras ──
  academicPerformance:    { ar: "الأداء الأكاديمي",         en: "Academic Performance" },
  topStudentsLeaderboard: { ar: "أفضل الطلاب في الأداء",    en: "Top Students Leaderboard" },
  noRecentAnnouncements:  { ar: "لا توجد إعلانات حديثة",    en: "No recent announcements" },
  noAttendanceToday:      { ar: "لم يُسجَّل حضور اليوم",    en: "No attendance recorded today" },
  noGradesRecorded:       { ar: "لم تُسجَّل درجات بعد",     en: "No grades recorded yet" },
  noTeacherAssigned:      { ar: "لم يُعيَّن معلم بعد",      en: "No teacher assigned yet" },
  passRate:               { ar: "نسبة النجاح",               en: "Pass Rate" },

  // ── Attendance extras ──
  morning:           { ar: "صباحي",             en: "Morning" },
  afternoon:         { ar: "مسائي",             en: "Afternoon" },
  shift:             { ar: "الفترة",            en: "Shift" },

  // ── Fees extras ──
  overdueFees:       { ar: "الرسوم المتأخرة",   en: "Overdue Fees" },
  overdueRecords:    { ar: "سجلات متأخرة",       en: "Overdue Records" },

  // ── Signup ──
  createYourSchool:    { ar: "إنشاء مدرستك",                                    en: "Create your school" },
  signupSubtitle:      { ar: "ستكون المدير. يمكنك إضافة المعلمين والطلاب لاحقاً", en: "You'll be the administrator. Add teachers and students later." },
  registerFree:        { ar: "سجّل مدرستك — مجاناً",                            en: "Register your school — free to start" },
  schoolNameEn:        { ar: "اسم المدرسة (إنجليزي / أساسي) *",                 en: "School Name (English / Primary) *" },
  schoolNameLocal:     { ar: "اسم المدرسة الثانوي / المحلي (اختياري)",           en: "Secondary / Local School Name (Optional)" },
  passwordMinChars:    { ar: "الحد الأدنى 6 أحرف",                               en: "Min. 6 characters" },
  confirmPassword:     { ar: "تأكيد كلمة المرور *",                              en: "Confirm Password *" },
  passwordLabel:       { ar: "كلمة المرور *",                                    en: "Password *" },
  creatingSchool:      { ar: "جارٍ إنشاء المدرسة…",                              en: "Creating school…" },
  createSchoolAccount: { ar: "إنشاء المدرسة والحساب",                            en: "Create School & Account" },
  alreadyRegistered:   { ar: "لديك حساب بالفعل؟",                                en: "Already registered?" },
  errPasswordMismatch: { ar: "كلمات المرور غير متطابقة",                          en: "Passwords do not match." },
  errPasswordShort:    { ar: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",          en: "Password must be at least 6 characters." },
  errSchoolRequired:   { ar: "اسم المدرسة مطلوب",                                 en: "School name is required." },
  errEmailInUse:       { ar: "هذا البريد مسجّل بالفعل. يرجى تسجيل الدخول",       en: "This email is already registered. Please sign in instead." },
  errCreateAccount:    { ar: "فشل إنشاء الحساب",                                  en: "Failed to create account." },

  // ── Subjects dialog ──
  subjectNameAr:       { ar: "اسم المادة (عربي) *",    en: "Subject Name (Arabic) *" },
  subjectNameEnCode:   { ar: "اسم المادة (إنجليزي) / الكود", en: "Subject Name (English) / Code" },
  addSubjectTitle:     { ar: "إضافة مادة",             en: "Add Subject" },
  editSubjectTitle:    { ar: "تعديل المادة",            en: "Edit Subject" },

  // ── DeleteDialog titles ──
  deleteStudent:       { ar: "حذف طالب",               en: "Delete Student" },
  deleteTeacher:       { ar: "حذف معلّم",               en: "Delete Teacher" },
  deleteClass:         { ar: "حذف صف دراسي",           en: "Delete Class" },
  deleteSubject:       { ar: "حذف مادة دراسية",         en: "Delete Subject" },
  deleteFeeRecord:     { ar: "حذف قيد رسوم",            en: "Delete Fee Record" },
  deleteAnnouncement:  { ar: "حذف إعلان",               en: "Delete Announcement" },
  deleteConfirmMsg:    { ar: "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.", en: "Are you sure? This action cannot be undone." },

  // ── StudentProfile ──
  studentNotFound:     { ar: "لم يُعثر على الطالب",    en: "Student not found" },
  bloodGroup:          { ar: "فصيلة الدم",              en: "Blood Group" },
  attendanceRate:      { ar: "نسبة الحضور",             en: "Attendance Rate" },
  recordedGrades:      { ar: "الدرجات المسجّلة",        en: "Recorded Grades" },
  scoreDistribution:   { ar: "توزيع الدرجات",           en: "Score Distribution" },
  byTerm:              { ar: "حسب الفصل",               en: "by Term" },
};

// ─── Context ─────────────────────────────────────────────────────────────────
interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export const I18nContext = createContext<I18nContextType>({
  lang: "ar",
  setLang: () => {},
  t: (key) => key,
  isRTL: true,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("lang") as Lang) || "ar";
  });

  const setLang = (l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);
  useState(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  });

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang];
  };

  return createElement(I18nContext.Provider, { value: { lang, setLang, t, isRTL: lang === "ar" } }, children);
}

export function useTranslation() {
  return useContext(I18nContext);
}
