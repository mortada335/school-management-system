# EduSaaS — A School Management System
### Case Study: Engineering Decisions That Shaped a Production-Grade SaaS

---

## The Starting Point

The brief was straightforward: build a school management system. The kind of thing where admins enter student records, teachers log grades, and someone checks attendance. Simple enough to prototype in a weekend, but the real challenge surfaced immediately — *what does "school management" actually mean for a real institution?*

The answer turned out to be: conflicting data ownership, language politics, four distinct user personas who must see fundamentally different interfaces, multi-year academic cycles, and a financial layer sensitive enough that a teacher browsing fees would be a compliance failure. The weekend prototype became a properly engineered system.

This document describes the decisions that mattered — not what the system does, but *why it works the way it does*.

---

## The Architecture Problem Nobody Talks About

Early in the build, the codebase had a `Dashboard.tsx` that was doing too much. It contained the sidebar, the navbar, the navigation items, the user dropdown, the auth redirect logic, the sidebar open/close state, and the `<Outlet>` for page content — 300+ lines in a single component. Adding a new nav item meant touching the same file as adding a logout button. Changing the auth logic meant scrolling past the sidebar CSS.

The fix wasn't about the code being ugly. It was about *what changes together should live together*. Three questions clarified the split:

1. What changes when a new page is added? — Only `routes/index.tsx`
2. What changes when the auth flow changes? — Only `AppLayout.tsx`
3. What changes when the nav design changes? — Only `Sidebar.tsx`

The result was a strict layering rule: `App.tsx` holds providers and nothing else. `routes/index.tsx` is a flat list of `<Route>` declarations. `AppLayout.tsx` owns auth checking and sidebar state. `Sidebar.tsx` owns its own data needs. Each file has one reason to change.

There was a secondary benefit: `ProtectedRoute.tsx` was deleted. The old pattern had two nested wrappers — one for auth checking, one for layout — both rendering `<Outlet>`. They were doing the same job. Merging them into `AppLayout` removed an entire layer of indirection from every protected route.

---

## Role-Based Access: Why Two Layers

The system has four roles: Superadmin, Admin, Teacher, Student. The naive approach is to check the role in each component and conditionally render. This works until it doesn't — when a new page is added, someone forgets to add the check, and a teacher can suddenly delete students.

The approach here uses two enforced layers simultaneously, not as redundancy but because they protect different things.

**The frontend layer** — a `<RoleGuard permission="...">` component reading from a centralized `PERMISSIONS` map — prevents users from *seeing* controls they shouldn't touch. This is about UX, not security. A delete button that disappears for teachers is a better experience than a button that throws an error.

**The Firestore security rules layer** prevents unauthorized *writes* even if the frontend guard is somehow bypassed. A teacher account genuinely cannot write to the `fees` collection — the database rejects it at the network level, regardless of what the UI renders.

The frontend guard is for experience. The security rules are for correctness. Relying on only one of them would be wrong either way.

The role system extends into the visual design too. The sidebar avatar uses a different gradient per role — amber for Superadmin, indigo for Admin, emerald for Teacher, sky for Student. This wasn't aesthetic decoration; it came from a practical observation during testing: when switching between demo accounts to verify permission behavior, it was impossible to tell which session you were in without looking at the profile dropdown. The color-coded avatar solved that instantly.

---

## The Seeding Bug That Could Have Gone Unnoticed

During development, the seed script was creating four demo accounts in sequence. After each run, the tests would fail in unpredictable ways — some dashboard data would load, some wouldn't, and the error messages pointed nowhere useful.

The bug: Firebase's `createUserWithEmailAndPassword` **automatically signs in the newly created user**. After creating the student account last, the application was authenticated as that student. The subsequent page loads were fetching data scoped to a student who had no school data properly seeded yet.

This could have been "fixed" by signing back in as admin after seeding, but that's a workaround, not a solution — it still means the admin's session was interrupted and the UX of the seed page would be broken.

The real fix was creating a **secondary Firebase app instance** — a completely isolated Firebase connection that handles all user creation without touching the primary app's authentication state at all:

```ts
const secondaryApp  = initializeApp(firebaseConfig, `seed-helper-${Date.now()}`);
const secondaryAuth = getAuth(secondaryApp);

// All demo accounts created through secondaryAuth
// Primary auth.currentUser never changes

await deleteApp(secondaryApp);
```

The secondary app is created, used, and destroyed within the seed operation. The admin who triggered the seed is still logged in when it completes. This is the kind of bug that's invisible until a demo fails in front of someone important.

---

## Internationalization as a Layout Problem

Adding Arabic wasn't a translation job. It was a layout architecture decision.

Arabic text reads right-to-left, which means the sidebar should be on the right, navigation flows in the opposite direction, and every padded, margined, or absolutely-positioned element needs to mirror. A simple `translate()` dictionary doesn't solve this — the entire spatial reasoning of the UI needs to invert.

The solution used Tailwind CSS's **logical CSS properties** throughout: `ps-` (padding-start) instead of `pl-`, `ms-` (margin-start) instead of `ml-`, `border-e` instead of `border-r`. These properties are direction-relative — they automatically flip when `dir="rtl"` is set on the document root. This meant language switching required exactly one line:

```ts
document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
```

The sidebar handles its own RTL logic — it reads the current language from context and moves from `left-0 border-r` to `right-0 border-l`. The language toggle in the navbar shows "عربي" when in English mode and "EN" when in Arabic mode — because the label should tell you what you're switching *to*, not what you're currently using.

---

## Multi-Year Academic Partitioning

Schools do not operate on an arbitrary timeline; their lifecycle revolves around distinct academic years (e.g., September 2025 to June 2026). When a new academic term starts, historical grades, tuition receipts, and attendance records cannot simply be wiped or mixed into current rosters.

The architecture handles this via a top-level `AcademicYearContext` that binds every query (classes, students, fees, attendance, grades) to an `academicYear` key. Switching the active year in the top navigation bar immediately updates the Firestore query filters across the dashboard without reloading the page. Historical audits remain immutable, while current operations reflect active rosters.

---

## Loading States as a Design System Problem

The first iteration of every page used the same pattern:

```tsx
if (loading) return "..."
```

Three dots. Scattered across 40+ stat values, chart containers, and table bodies. This looked broken, felt broken, and meant there was no consistent visual language for "data is on its way."

The refactor extracted three components:

**`Skeleton.tsx`** provides shimmer placeholders in the exact shape of what they're replacing — a 32×96px shimmer where a number will appear, a 180px tall block where a chart will render. The shimmer matches the content's dimensions so the layout doesn't jump when data loads.

**`DataWrapper.tsx`** eliminates the `if (loading) / if (error) / if (empty)` chain that every page was reimplementing independently. Any page that fetches data wraps its output in `<DataWrapper loading error empty skeleton>`. The four states — loading, error, empty, data — are handled consistently once, everywhere.

**`DeleteDialog.tsx`** replaced all `window.confirm()` calls. The browser's native confirm dialog has no loading state — after clicking "OK", the UI appears frozen while the Firestore delete completes. The custom dialog shows a spinner on the confirm button, closes properly on `Escape` and backdrop click, and positions focus correctly for keyboard navigation.

These three components don't add features. They add *consistency*, which at a certain codebase size is more valuable.

---

## Unified Visual Language: Lucide Icons & Dark Mode Color Grading

A dashboard littered with mismatched emoji icons and disparate SVG snippets immediately betrays amateur execution. The visual layer was unified around two key refinements:

### 1. Cohesive Iconography with Lucide React
All inline SVGs and ad-hoc emojis across the sidebar, navigation bar, stat cards, dialogs, and table actions were migrated to **Lucide React**. Every icon uses a consistent stroke width (`1.75`–`2.0px`), unified optical sizing (`h-4 w-4` or `h-5 w-5`), and inherits semantic currentColor styling.

### 2. High-Fidelity Dark Mode (OKLCH Color Space)
Generic dark modes often rely on harsh `#000000` backgrounds with high-contrast `#ffffff` text, causing severe eye strain. The theme architecture uses tailored OKLCH color tokens and a deep midnight background (`#0d0d14`):
- **Layered Elevation:** Cards sit on `oklch(0.14 ...)` against the `#0d0d14` viewport background, providing clear visual separation without heavy borders.
- **Subtle Boundaries:** Hairline borders (`rgba(255, 255, 255, 0.06 - 0.08)`) create subtle edge definitions.
- **Chart Harmony:** Recharts SVG elements (grids, axes, tooltips) dynamically read `isDark` from `ThemeContext` and compute explicit stroke and fill values, ensuring charts match the deep palette seamlessly.

---

## What Would Be Done Differently

**Code splitting.** The production bundle is ~1.9MB uncompressed. Recharts and SheetJS together account for the majority of it. `React.lazy()` with dynamic imports on page components would cut the initial load to under 300KB — the rest loads only when navigated to.

**Real-time listeners.** Every data fetch in the system is a one-time `getDocs()` call. For attendance recording especially, where multiple teachers might be marking the same class simultaneously, `onSnapshot()` listeners would prevent stale reads. The architecture already supports it — `useAuth` provides `schoolId`, the data layer is centralized — it's purely an implementation gap.

**The `/seed` route is public.** Anyone who knows the URL can seed demo data into the system. This should be behind an environment variable check or removed entirely before production deployment. It exists as a developer convenience and was never hardened.

**Pagination.** All collection fetches return the full dataset. For a school with 1,000+ students, `fetchCollection("students")` becomes a performance problem. Cursor-based pagination with Firestore's `startAfter()` would solve this without structural changes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 — OKLCH tokens, logical properties, class-based dark mode |
| Database | Firebase Firestore — multi-tenant `/schools/{id}/` |
| Auth | Firebase Authentication |
| Iconography | Lucide React (`lucide-react`) |
| Charts | Recharts — theme-adaptive via JavaScript props |
| Export | SheetJS (`xlsx`) |
| i18n | Custom context — Arabic / English, RTL/LTR |
