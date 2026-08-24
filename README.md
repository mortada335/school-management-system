# EduSaaS — Multi-Tenant School Management System

This is a school management platform I built using React 19, TypeScript, Tailwind CSS v4, and Cloud Firestore. It handles student records, teacher assignments, attendance, grades, and fee tracking. It supports multiple academic years, full Arabic/English localization, and role-based access control for four user types.

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

### Component Decomposition

Initially, `AppLayout.tsx` was doing too much. It contained auth logic, the sidebar, the nav, route rendering, and responsive state. Adding a navigation item meant modifying the same file as auth redirects.

I split this up:

- **`App.tsx`**: Mounts providers (`AuthProvider`, `AcademicYearProvider`, `ThemeProvider`, `TranslationProvider`) and nothing else.
- **`AppLayout.tsx`**: Handles auth checking, redirects unauthenticated users to `/login`, and owns the sidebar state and responsive shell.
- **`routes/index.tsx`**: A flat list of route declarations. Adding a page only requires touching this file.
- **`Sidebar.tsx` / `Navbar.tsx`**: These components read from context directly instead of relying on props passed down from the layout.

This separation allowed me to delete `ProtectedRoute.tsx`. Previously, there were two nested wrappers doing the same job of rendering `<Outlet>`. Merging them into `AppLayout` removed a layer of indirection for protected routes.

### Role-Based Access Control

The system uses four roles: Superadmin, Admin, Teacher, and Student. I chose to enforce permissions at two levels to protect different aspects of the application.

```
[User Action] ──► [Layer 1: Frontend <RoleGuard>] ──► [Layer 2: Firestore Security Rules] ──► [Database]
                    (Hides UI for unauthorized roles)       (Blocks unauthorized writes at DB level)
```

- **`<RoleGuard permission="...">`**: Reads from a centralized permission map. Buttons and routes that the user shouldn't access simply do not render.
- **Firestore security rules**: If someone bypasses the UI by making direct API calls, the database rejects writes that don't match the user's token claims. A teacher account cannot write to the `fees` collection at the network level.

The frontend guard handles the user experience, while the security rules ensure data correctness. Both are necessary. 

As a side effect from testing, sidebar avatars are color-coded by role (Amber for Superadmin, Indigo for Admin, Emerald for Teacher, Sky for Student). This makes it obvious which session you are currently testing.

### Multi-Year Academic Partitioning

Schools operate in fixed academic years. Old grades, attendance records, and invoices cannot be mixed into the current year's data or overwritten.

I handled this using an `AcademicYearContext` which scopes Firestore queries to the selected year:

```ts
where("academicYear", "==", activeYear)
```

Switching the active year in the navigation updates all queries across the application immediately without a page reload. Historical years are read-only, while current years accept writes.

### Arabic and English RTL Support

Adding Arabic required flipping the entire spatial layout. The sidebar moves from left to right, padding and margin directions invert, and borders swap sides.

Instead of maintaining two sets of CSS, I used Tailwind's logical property utilities:

- `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
- `ms-*` / `me-*` instead of `ml-*` / `mr-*`
- `border-s-*` / `border-e-*` instead of `border-l-*` / `border-r-*`

These resolve to the correct physical side based on the `dir` attribute on the document root. Switching languages only requires one line of code:

```ts
document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
```

The layout flips automatically without conditional class lists or duplicate CSS.

### Filter Architecture and Search Debouncing

Rather than having each page build its own search inputs and filter menus from scratch, I created a centralized filter system composed of two coordinated components:

- **`FiltersSection.tsx`**: An inline search bar containing the search trigger, input field with local debounce, filter menu toggle, and a clear-all button. It uses a custom `useDebounce` hook to throttle query updates and prevent excessive database reads during rapid keystrokes.
- **`FiltersMenu.tsx`**: An animated drawer powered by Framer Motion that dynamically renders filter controls based on a configuration schema. It supports standard selects, date pickers, year/month pickers, and searchable comboboxes.

```tsx
<FiltersSection
  searchQuery={search}
  setSearchQuery={setSearch}
  isMenuOpen={isMenuOpen}
  setIsMenuOpen={setIsMenuOpen}
  placeholderKey="searchStudents"
  hasActiveFilters={filterClass !== "all" || filterGender !== "all" || !!search}
  onClearFilters={handleReset}
/>
<FiltersMenu
  isMenuOpen={isMenuOpen}
  setIsMenuOpen={setIsMenuOpen}
  filters={filterConfigs}
  values={filterValues}
  onChange={handleFilterChange}
/>
```

### Loading and Empty State Management

Early versions of each page had ad-hoc loading spinners and inconsistent empty states. I extracted reusable components to standardize data fetching states:

**`<DataWrapper />`**

`DataWrapper` unifies the four async data states: loading, error, empty, and populated data. It handles empty states both when a collection is completely empty and when a search or filter produces zero matching results. It also includes an inline "Clear filters" action that lets users reset active filters directly from the empty state view.

```tsx
<DataWrapper
  loading={loading}
  error={error}
  empty={filtered.length === 0}
  emptyMessage="No students found matching your filters"
  onClearFilters={handleReset}
  skeleton={<SkeletonTableRow cols={7} />}
  onRetry={loadData}
>
  <StudentTable data={filtered} />
</DataWrapper>
```

**`<Skeleton />`**

These are shimmer placeholders that match the dimensions of the content they replace. The layout doesn't shift when data arrives because the placeholder takes up the exact same space.

**`<DeleteDialog />`**

I replaced `window.confirm()` calls with a custom dialog. The browser's default confirm has no loading state, making the UI look frozen during a Firestore deletion. The custom dialog renders via a portal at a high z-index, shows a spinner on the confirm button, locks body scroll, and closes on Escape or clicking the backdrop.

### Icons and Dark Mode

I replaced emojis and ad-hoc SVGs with Lucide React for consistent stroke width and sizing across the application.

For dark mode, I used OKLCH color tokens instead of flat grays. The background is `#0d0d14`, cards sit on `oklch(0.14 ...)`, and borders use `rgba(255,255,255,0.06–0.08)`. This creates visible depth between layers.

Since Recharts SVG elements do not inherit CSS custom properties, chart components read the current theme directly from `ThemeContext` and pass explicit color values for axis ticks, grid lines, and tooltips.

### Database Seeding

Calling `createUserWithEmailAndPassword` in Firebase automatically signs in the new account, which would overwrite the current session during seeding. To avoid this, the seeder script creates a temporary secondary Firebase app instance, provisions the accounts, and then deletes the temporary app:

```ts
const secondaryApp  = initializeApp(firebaseConfig, `seed-worker-${Date.now()}`);
const secondaryAuth = getAuth(secondaryApp);

await createUserWithEmailAndPassword(secondaryAuth, email, password);

await deleteApp(secondaryApp);
```

The primary auth state remains untouched. The `/seed` route populates a full demo environment including classes, students, teachers, grades, attendance, and fee records.

### Performance Optimizations

I implemented several optimizations to improve the application's performance:

- **Code splitting:** I added `React.lazy()` with dynamic imports per route. This cuts the initial load significantly since heavy libraries like Recharts and SheetJS only load when navigating to pages that require them.
- **Real-time listeners:** I replaced one-time `getDocs()` calls with `onSnapshot()` listeners for attendance and grades. This prevents stale reads if multiple teachers record data simultaneously.
- **Pagination:** I added Firestore's `startAfter()` cursor pagination for list views to handle scaling for schools with hundreds of records.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Core Framework | React 19 + TypeScript | |
| Build Tool | Vite 8 + Rolldown | |
| Styling | Tailwind CSS v4 | OKLCH tokens, logical properties, class-based dark mode |
| UI Components | Radix / Base UI + Lucide React | Portaled dialogs, tooltips, select dropdowns |
| Animations | Framer Motion | Smooth drawer animations for filter menus |
| Database | Firebase Firestore | Multi-tenant `/schools/{id}/` collection structure |
| Authentication | Firebase Auth | Token-based, claims used in Firestore rules |
| Charts | Recharts | Receives theme colors via JS props |
| Excel Export | SheetJS (`xlsx`) | Client-side, no backend needed |
| Date Handling | date-fns | Formatting and comparisons |
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

## What Would Be Done Differently

- **Firestore Composite Indexes:** Implementing sorting combined with filtering (like paginated filtered lists) requires creating composite indexes in the Firebase Console. The Firebase SDK logs the exact index creation URLs in the browser console when they are needed. Automating this via `firestore.indexes.json` and the Firebase CLI would reduce manual setup steps.
- **Client-Side Aggregation:** The Fees dashboard calculates total amounts by fetching all fee records for the current academic year to the client. While this works for smaller datasets, it scales poorly. Moving aggregation logic to Firebase Cloud Functions or using Firestore's built-in aggregation queries would improve performance as the dataset grows.
