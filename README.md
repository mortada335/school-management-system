# EduSaaS — School Management System 🎓
*A Technical Case Study in Building Scalable, Role-Based Educational Technology*

---

## 1. Executive Summary

The goal of this project was to architect a **unified, production-ready** platform that eliminates the administrative fragmentation typical in school management. By centralizing academics, attendance, and financial tracking into a single real-time system — with full Arabic/English support and an adaptive light/dark UI — this application delivers what a real institution needs, not just what a portfolio demo promises.

Built with **React 19 + Vite**, **Firebase** (Auth + Firestore), **Recharts**, and **Tailwind CSS v4**, the system is a high-fidelity SaaS product: multi-tenant, role-gated, fully bilingual, and responsive from mobile to desktop.

---

## 2. The Problem Statement

Educational institutions frequently rely on a mix of legacy software, spreadsheets, and paper records. This creates several recurring pain points:

| Problem | Real-World Impact |
|---|---|
| **Data Silos** | Financial data is disconnected from grades, making it impossible to get a holistic view of a student's standing without cross-referencing multiple sources |
| **Access Control Risks** | Teachers should enter grades without seeing financial records; students must see only their own data |
| **Language & Direction Barriers** | Arabic RTL layouts require more than just translation — the entire UI must mirror itself without a page reload |
| **Missing Reporting** | Trend analysis (class performance curves, revenue forecasting, attendance drop-offs) is critical but rarely available out of the box |
| **Session Hijacking by Seeder** | Creating demo accounts with Firebase Auth automatically signs-in the new user, silently destroying the admin session — a subtle but critical bug |

---

## 3. Technical Architecture & Solutions

### A. Role-Based Access Control (RBAC) — Frontend + Security Rules

**Challenge:** Four distinct user personas — Superadmin, Admin, Teacher, and Student — each requiring a completely different UI and permission set across every module.

**Solution:** A dual-layer security model was implemented:
- **Frontend:** A custom `<RoleGuard permission="...">` component reads from a `PERMISSIONS` map keyed by role. Entire UI sections (delete buttons, payroll exports, student add forms) are rendered only when the logged-in user's role grants the required permission.
- **Firestore Rules:** All data lives under `/schools/{schoolId}/...` — a multi-tenant architecture that completely isolates one school's data from another. Students can only `get` their own documents; Teachers cannot write to the `fees` collection at all.

### B. Deep Internationalization (i18n) — Arabic & English, RTL/LTR

**Challenge:** True localization is far more than a dictionary lookup. The entire page layout must mirror itself for Arabic (RTL) without a page reload or state loss.

**Solution:** A custom `I18nProvider` with a `useTranslation()` hook manages **250+ translation keys** across Arabic and English. On language switch:
1. `document.documentElement.setAttribute("dir", "rtl")` flips the global layout direction
2. Tailwind's logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`) automatically mirror padding and margins
3. Language preference is persisted to `localStorage` and restored on next visit — zero flicker

### C. Theme System — Light & Dark Mode with Persistent State

**Challenge:** A "dark mode" toggle that truly works requires more than flipping CSS variables. Recharts SVG elements (grids, axes, tooltip backgrounds) are controlled through JavaScript props, not CSS, and must be re-computed on theme change.

**Solution:** A `ThemeContext` provides `isDark`, `theme`, and `toggleTheme` globally. Each chart component reads `isDark` and constructs its own color variables:
```ts
const gridStroke = isDark ? "#ffffff10" : "#e2e8f0";
const axisColor  = isDark ? "#9ca3af"   : "#64748b";
const tooltipStyle = isDark
  ? { background: "#18181b", border: "1px solid #27272a", color: "#fff" }
  : { background: "#ffffff", boxShadow: "0 10px 15px rgba(0,0,0,0.1)", color: "#0f172a" };
```
Tailwind CSS v4's `@custom-variant dark` directive handles all CSS-class based styling via the `.dark` class on `<html>`.

### D. Seed System — Solving the Firebase Session Hijacking Bug

**Challenge:** Firebase's `createUserWithEmailAndPassword` **automatically signs in** the newly created user. When the seed script creates 4 demo accounts sequentially, each creation silently overwrites the current session — so the admin running the seed ends up logged in as `student@demo.school` after it completes. The dashboard then fails to load with the right school's data.

**Solution:** The seeder creates a **secondary, isolated Firebase app instance** using `initializeApp(config, 'seed-helper')`. All 4 demo accounts are created through this secondary `auth` handle, which is completely independent of the primary app's authentication state. After seeding completes, `deleteApp(secondaryApp)` cleanly removes it:

```ts
const secondaryApp  = initializeApp(firebaseConfig, `seed-helper-${Date.now()}`);
const secondaryAuth = getAuth(secondaryApp);
// ... create users through secondaryAuth ...
await deleteApp(secondaryApp); // clean up — no session was touched
```

The admin who triggered the seed remains logged in throughout.

### E. Atomic Data Operations — Firestore Batched Writes

**Challenge:** Marking attendance for a class of 40 students, or saving a full grade sheet, triggers dozens of simultaneous writes. Naive implementations cause UI freezes, partial saves, and race conditions.

**Solution:** All multi-record save operations (grades, attendance, seeding) use Firestore `writeBatch()`. Every change is staged in memory and committed as a single atomic transaction. If any write fails, the entire batch rolls back — no partial data is ever saved to the database.

### F. Actionable Analytics — Theme-Adaptive Recharts Dashboards

**Challenge:** Raw tables of grades and fees are meaningless at a glance. Charts must adapt to the current theme and remain readable on mobile.

**Solution:**
- **Student Radar Chart:** Maps individual academic strengths per subject
- **Class Grade Distribution Pie:** Visualizes pass/fail ratios school-wide  
- **7-Day Attendance Trend (Line Chart):** Identifies absenteeism patterns
- **Monthly Revenue Bar Chart:** Tracks billed vs. collected fees over time
- **Fee Type Breakdown Pie:** Reveals which fee categories drive collection gaps

All charts dynamically recalculate stroke, fill, and tooltip styles based on the current theme. Recharts' `Tooltip formatter` callbacks are typed correctly to avoid TypeScript conflicts.

---

## 4. Key Module Highlights

| Module | Highlight |
|---|---|
| **Overview Dashboard** | 7-day attendance trends, monthly revenue tracking, top-student leaderboard, pass/fail pie — all dual-themed |
| **Student Profile 360°** | Tabbed view: subject radar chart, term-by-term bar chart, full attendance history, fee ledger |
| **Smart Attendance** | Bulk status toggles (Present/Absent/Late/Excused), daily summary stats, 10-day history export |
| **Grade Matrix** | Per-subject, per-term score grid with letter grades (A+ → F), 🥇🥈🥉 medals, score distribution bar chart |
| **Fee Tracker** | KPI cards (collected/billed/outstanding/overdue), payment status toggles, overdue highlighting, Excel export |
| **Announcements Board** | Priority-tagged (🔴 Urgent / 🟡 Normal / 🔵 Info) pinnable notices with role-based audience targeting |
| **Demo Seeder (/seed)** | Idempotent one-click seeder — 40 students, 8 teachers, 6 classes, 400 attendance records, 320 grade entries, all without disrupting the current admin session |

---

## 5. Running the Project (Reviewer Guide)

### Setup
```bash
npm install
npm run dev
```
Navigate to `http://localhost:5173`

### Seeding Demo Data

1. Open `http://localhost:5173/seed`
2. Click **"Seed Demo Data"** — watch the live progress log
3. After completion, go to `/login` and use any demo account:

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@demo.school | Demo@12345 |
| Admin | admin@demo.school | Demo@12345 |
| Teacher | teacher@demo.school | Demo@12345 |
| Student | student@demo.school | Demo@12345 |

> The seed script uses a secondary Firebase app instance so your current session is **never interrupted**.

### Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 (class-based dark mode) |
| Backend | Firebase Auth + Firestore (multi-tenant) |
| Charts | Recharts |
| Excel Export | SheetJS (xlsx) |
| i18n | Custom Context (Arabic / English, RTL/LTR) |
| Icons | Emoji + inline SVG |
