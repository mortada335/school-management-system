# 🏫 Multi-Tenant School Management SaaS

A modern, high-performance, multi-tenant **School Management System (SaaS)** built with React 19, TypeScript, Tailwind CSS v4, and Cloud Firestore.

Designed for managing multiple educational institutions with complete tenant isolation, academic year tracking, and comprehensive administrative modules.

---

## 🌟 Key Features

- **Multi-Tenant SaaS Architecture**: Path-based isolation (`/schools/{schoolId}/*`) guaranteeing data security and tenant privacy.
- **Academic Year Scoping**: Global academic year switcher (`2025–2026`, `2024–2025`) filtering data across all modules in real time.
- **8 Core Administration Modules**:
  1. **Dashboard Overview**: Key metrics (Students, Teachers, Classes, IQD Fees Collected), recent notices, and live attendance tracking.
  2. **Classes Management**: Grade levels (1–12), sections (A–F), homeroom teacher links, and class search.
  3. **Subjects Management**: Course catalog with English names and search.
  4. **Teachers Directory**: Staff records, email/phone contact cards, and assigned classes.
  5. **Students Directory**: Class filtering, gender distribution, guardian contact records, and enrollment years.
  6. **Attendance Tracking**: Daily class attendance register with status toggles (*Present, Absent, Late, Excused*) and batch Firestore sync.
  7. **Grades & Results**: Term-based exam evaluation (*First Term, Second Term, Final Exam*), percentage calculation, and pass/fail indicators.
  8. **Fees & Payments**: Tuition and billing tracking in **Iraqi Dinar (IQD / د.ع)** with paid vs. total financial dashboards and payment toggles.
  9. **Announcements**: School-wide bulletin board targeted by role (*All, Teachers Only, Students & Parents*).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI primitives, Glassmorphism
- **Backend & Auth**: Firebase Authentication, Cloud Firestore (Native Mode)
- **Deployment**: Firebase Hosting & Firestore Security Rules

---

## 📁 Project Structure

```
school-management-system/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── combobox.tsx       # Searchable async selection dropdown
│   │   │   ├── dialog.tsx         # Shadcn modal dialog primitive
│   │   │   └── ...
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   ├── AcademicYearContext.tsx # Global active academic year state
│   │   └── AuthContext.tsx         # Multi-tenant user auth & profile sync
│   ├── lib/
│   │   ├── firebase.ts            # Firebase SDK initialization
│   │   ├── firestore-helpers.ts   # Scoped CRUD & IQD currency helpers
│   │   └── seed-data.ts           # Demo data generator
│   ├── pages/
│   │   ├── Overview.tsx           # Main analytics dashboard
│   │   ├── Classes.tsx            # Classes CRUD
│   │   ├── Subjects.tsx           # Subjects CRUD
│   │   ├── Teachers.tsx           # Teachers directory
│   │   ├── Students.tsx           # Students directory
│   │   ├── Attendance.tsx         # Attendance register
│   │   ├── Grades.tsx             # Exam results & grades
│   │   ├── Fees.tsx               # Tuition billing
│   │   ├── Announcements.tsx      # School notices
│   │   ├── Login.tsx              # Authentication login
│   │   └── Signup.tsx             # Automated school registration
│   ├── types/
│   │   └── index.ts               # Domain model definitions
│   ├── App.tsx                    # React Router configuration
│   └── main.tsx
├── firebase.json                  # Firebase CLI hosting & rewrite config
├── firestore.rules                # Tenant-isolation security rules
└── firestore.indexes.json         # Composite database indexes
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+`
- `pnpm` (or `npm`)
- Firebase Account

### 2. Installation
```bash
git clone <repository-url>
cd school-management-system
pnpm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=school-management-system-cebfd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=school-management-system-cebfd
VITE_FIREBASE_STORAGE_BUCKET=school-management-system-cebfd.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Development Server
```bash
pnpm dev
```
Open `http://localhost:5173` in your browser.

---

## 🔒 Multi-Tenant Data & Security Rules

All school data is automatically scoped under `/schools/{schoolId}/*`. Deploy Firestore security rules with:

```bash
npx firebase-tools deploy --only firestore
```

---

## 📄 License
Licensed under the MIT License.
