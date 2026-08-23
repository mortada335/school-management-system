# EduSaaS — Multi-Tenant School Management System

A school management platform built on React 19, TypeScript, Tailwind CSS v4, and Cloud Firestore. It handles student records, teacher assignments, attendance, grades, and fee tracking across multiple academic years, with full Arabic/English support and role-based access for four user types.

---

## Architecture Overview

```
                             ┌───────────────────────────────┐
                             │       React 19 Root App       │
                             │  (Providers: Auth, Year, i18n) │
                             └───────────────┬───────────────┘
                                             │
                                ┌────────────┴────────────┐
                                │       AppLayout         │
                                │ (Auth Guard + Shell UI) │
                                └──┬───────────────────┬──┘
                                   │                   │
                     ┌─────────────┴─────┐       ┌─────┴─────────────┐
                     │    Sidebar.tsx    │       │    Navbar.tsx     │
                     │ (Role-Aware Nav)  │       │(Year/Theme/Lang)  │
                     └───────────────────┘       └───────────────────┘
                                           │
                                ┌──────────┴──────────┐
                                │   React Router v7   │
                                │   <Outlet /> Views  │
                                └──────────┬──────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
     ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
     │  <RoleGuard />  │          │ <DataWrapper /> │          │ <DeleteDialog />│
     │  (UI Security)  │          │ (4-State Async) │          │(Portaled Modal) │
     └─────────────────┘          └─────────────────┘          └─────────────────┘
```

---

## Technical Decisions

### 1. Component Decomposition

Early on, `AppLayout.tsx` was doing too much — it held auth logic, the sidebar, the nav, route rendering, and responsive state all in one file. Adding a nav item meant touching the same file as auth redirects.

The split I landed on:

- **`App.tsx`**: Mounts providers (`AuthProvider`, `AcademicYearProvider`, `ThemeProvider`, `TranslationProvider`) and nothing else.
- **`AppLayout.tsx`**: Handles auth checking, redirects unauthenticated users to `/login`, and owns sidebar open/close state and the responsive shell.
- **`routes/index.tsx`**: Flat list of route declarations. Adding a page means only touching this file.
- **`Sidebar.tsx` / `Navbar.tsx`**: Each reads from context directly — no props passed down from the layout.

This also let me delete `ProtectedRoute.tsx`. There were two nested wrappers both rendering `<Outlet>`, doing the same job. Merging them into `AppLayout` removed a layer of indirection from every protected route.

---

### 2. Role-Based Access Control

The system has four roles: Superadmin, Admin, Teacher, Student. I chose to enforce permissions at two levels rather than one, because they protect different things.

```
[User Action] ──► [Layer 1: Frontend <RoleGuard>] ──► [Layer 2: Firestore Security Rules] ──► [Database]
                    (Hides UI for unauthorized roles)       (Blocks unauthorized writes at DB level)
```

- **`<RoleGuard permission="...">`**: Reads from a centralized permission map. Unauthorized buttons and routes simply don't render — no error messages for the user, no guessing.
- **Firestore security rules**: Even if someone bypasses the UI (e.g., making direct API calls), the database rejects writes that don't match the user's token claims. A teacher account cannot write to the `fees` collection at the network level.

The frontend guard handles UX. The security rules handle correctness. You need both — one without the other is incomplete.

One side effect: sidebar avatars are color-coded by role (Amber = Superadmin, Indigo = Admin, Emerald = Teacher, Sky = Student). This came out of testing, not design — when switching between demo accounts to verify permission behavior, it was hard to tell which session you were in. The avatar color solved that immediately.

---

### 3. Multi-Year Academic Partitioning

Schools run in fixed academic years (e.g., 2025–2026). Old grades, attendance records, and paid invoices can't be mixed into the current year's data or overwritten when a new term starts.

I handled this with `AcademicYearContext`, which scopes every Firestore query to the selected year:

```ts
where("academicYear", "==", activeYear)
```

Switching the active year in the top nav updates all queries across the app immediately, no page reload. Historical years are read-only; current years accept live writes.

---

### 4. Arabic / English RTL Support

Adding Arabic wasn't just translating strings — the entire spatial layout has to flip. The sidebar moves from left to right, padding/margin directions invert, borders swap sides.

Rather than maintaining two sets of CSS, I used Tailwind's logical property utilities throughout:

- `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
- `ms-*` / `me-*` instead of `ml-*` / `mr-*`
- `border-s-*` / `border-e-*` instead of `border-l-*` / `border-r-*`

These are direction-relative — they resolve to the correct physical side based on whatever `dir` attribute is on the document root. Switching languages is then one line:

```ts
document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
```

The layout flips automatically. No conditional class lists, no duplicate CSS.

---

### 5. Loading States

The first version of every page had the same pattern:

```tsx
if (loading) return "..."
```

Three dots everywhere — no consistent visual language, no indication of what shape the data would be.

I extracted three components to address this:

**`<DataWrapper />`**

Every page that fetches data was reimplementing the same `loading / error / empty / data` conditional chain. `DataWrapper` handles all four states once, in one place:

```tsx
<DataWrapper
  loading={loading}
  error={error}
  empty={students.length === 0}
  emptyMessage="No students registered yet"
  skeleton={<SkeletonTableRow cols={7} />}
  onRetry={loadData}
>
  <StudentTable data={students} />
</DataWrapper>
```

**`<Skeleton />`**

Shimmer placeholders that match the dimensions of the content they replace — stat cards, tables, charts, profile banners. The layout doesn't shift when data arrives because the placeholder takes up the same space.

**`<DeleteDialog />`**

Replaced all `window.confirm()` calls. The browser's default confirm has no loading state, so the UI looks frozen while a Firestore delete is in flight. The custom dialog renders via `createPortal(..., document.body)` at `z-[100]` (so it sits above the sidebar), shows a spinner on the confirm button during deletion, locks body scroll, and closes on `Escape` or backdrop click.

---

### 6. Icons and Dark Mode

All emojis and ad-hoc SVGs were replaced with **Lucide React** to get a consistent stroke width and sizing across the app (`14px`–`20px`, `1.75px`–`2.0px` stroke).

For dark mode, I used OKLCH color tokens instead of flat grays. Background is `#0d0d14`, cards sit on `oklch(0.14 ...)`, and borders use `rgba(255,255,255,0.06–0.08)`. This gives visible depth between layers without harsh contrast.

Recharts SVG elements don't inherit CSS custom properties, so chart components read `isDark` from `ThemeContext` directly and pass explicit color values for axis ticks, grid lines, and tooltip backgrounds.

---

### 7. Database Seeding

`createUserWithEmailAndPassword` in Firebase automatically signs in the new account, which would overwrite the current admin session during seeding. To avoid that, the seeder creates a temporary secondary Firebase app instance, provisions accounts through it, then deletes it:

```ts
const secondaryApp  = initializeApp(firebaseConfig, `seed-worker-${Date.now()}`);
const secondaryAuth = getAuth(secondaryApp);

await createUserWithEmailAndPassword(secondaryAuth, email, password);

await deleteApp(secondaryApp);
```

The primary auth state is never touched. The `/seed` route creates a full demo environment including classes, students, teachers, grades, attendance, and fee records.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Core Framework | React 19 + TypeScript | |
| Build Tool | Vite 8 + Rolldown | |
| Styling | Tailwind CSS v4 | OKLCH tokens, logical properties, class-based dark mode |
| Database | Firebase Firestore | Multi-tenant `/schools/{id}/` collection structure |
| Authentication | Firebase Auth | Token-based, claims used in Firestore rules |
| Charts | Recharts | Receives theme colors via JS props |
| Excel Export | SheetJS (`xlsx`) | Client-side, no backend needed |
| Icons | Lucide React | |
| Localization | Custom context | Arabic + English, RTL/LTR switching |

---

## Running Locally

```bash
git clone https://github.com/mortada335/school-management-system.git
cd school-management-system
pnpm install
pnpm dev
```

Navigate to `/seed` first to populate the database with demo data, then log in with any of these accounts:

| Role | Email | Password | Access |
|---|---|---|---|
| Superadmin | `superadmin@demo.school` | `Demo@12345` | Everything |
| Admin | `admin@demo.school` | `Demo@12345` | Students, teachers, fees, classes |
| Teacher | `teacher@demo.school` | `Demo@12345` | Attendance, grades, class rosters |
| Student | `student@demo.school` | `Demo@12345` | Own records only |

---

## What I'd Change
`
**Code splitting.** The production bundle is ~1.9MB uncompressed. Recharts and SheetJS are the main contributors. Adding `React.lazy()` with dynamic imports per route would cut initial load significantly — those libraries only load when the user navigates to a page that needs them.

**Real-time listeners.** Every fetch is a one-time `getDocs()` call. For attendance in particular, where two teachers might be recording the same class at the same time, this means stale reads. Switching to `onSnapshot()` would fix it — the auth and data layer already support it, it's just not implemented.

**Pagination.** All collection queries return full datasets. For a school with hundreds of students, `fetchCollection("students")` will get slow. Firestore's `startAfter()` cursor pagination would solve this without structural changes to the data layer.
