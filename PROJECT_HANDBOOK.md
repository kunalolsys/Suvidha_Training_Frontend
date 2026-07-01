# Suvidha Training University (STU) — Project Handbook

> **For**: The development team inheriting this project
> **Last Updated**: 29 June 2026
> **Current Phase**: Phase 3 (Admin Portal) complete. Phase 4 (Supabase Integration) not started.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture & File Structure](#3-architecture--file-structure)
4. [Data Models](#4-data-models)
5. [Data Stores (State Management)](#5-data-stores-state-management)
6. [Authentication System](#6-authentication-system)
7. [Route Map](#7-route-map)
8. [Report Calculations — Detailed Breakdown](#8-report-calculations--detailed-breakdown)
9. [Key Business Rules](#9-key-business-rules)
10. [Design System (StyleSystem)](#10-design-system-stylesystem)
11. [Current State & Known Limitations](#11-current-state--known-limitations)
12. [Next Steps for the Team](#12-next-steps-for-the-team)

---

## 1. Project Overview

**Suvidha Training University (STU)** is an internal staff training portal. Employees log in, are assigned sequential training videos based on their **designation** (department), and must pass an MCQ quiz after each video to unlock the next one. Admins manage videos, questions, employees, and view analytics through a separate admin panel.

### Core Concepts

| Concept | Description |
|---|---|
| **Designation** | The 9 departments: Sales, Operations, HR, IT, Finance, Front Desk, Housekeeping, Management, Kitchen Staff |
| **Store** | Physical Suvidha location. 12 stores across North India. Each employee belongs to exactly one store. |
| **Video** | Training content assigned to a specific designation. Videos are sequential (enforced by `sortOrder`). |
| **MCQ Quiz** | 3-5 multiple-choice questions per video. Employee must score **100%** (all correct) to pass. |
| **Progress** | Per-employee, per-video record tracking status (`locked`, `unlocked`, `completed`), attempt count, and full attempt history. |

### Two-Portal Architecture

- **Employee Portal** (`/`, `/dashboard`, `/learn/:videoId`) — what staff use for training
- **Admin Portal** (`/admin`, `/admin/dashboard`, `/admin/videos`, `/admin/questions`, `/admin/employees`, `/admin/reports`) — what management uses to run the program

---

## 2. Tech Stack

### Foundation

| Layer | Technology | Notes |
|---|---|---|
| **Runtime** | Browser-only SPA | No server-side rendering |
| **Framework** | React 19.1.2 | Latest React; project rules forbid downgrading |
| **Language** | TypeScript 5.8 | Strictly typed throughout |
| **Build Tool** | Vite 8 | Dev server + production bundling |
| **Routing** | React Router DOM v7 | Client-side SPA routing with `__BASE_PATH__` prefix for deployment |
| **Styling** | Tailwind CSS 3.4 | Utility-first; see Design System section below |
| **Package Manager** | npm | `package.json` in project root |

### Styling & UI

| Concern | Solution |
|---|---|
| **Color System** | Readdy StyleSystem — 5 roles × 11-step OKLCH palette: `background`, `primary`, `accent`, `secondary`, `foreground`. All colors consumed as CSS custom properties via `oklch(var(--token) / <alpha-value>)`. Dark mode supported through `.dark` class override. |
| **Typography** | Inter (Google Fonts), served via CDN. CSS variables: `--font-heading`, `--font-body`, `--font-label` all pointing to Inter. |
| **Icons** | Remix Icon 4.5 + Font Awesome 6.4 — both loaded via CDN in `index.html`. Zero npm icon packages. |
| **Animations** | CSS keyframes only (e.g., `slideInRight` for drawer animations). No animation library dependency. |

### State Management

| Approach | Where Used |
|---|---|
| **React Context** | Auth state (`AuthProvider` wrapping entire app) |
| **In-Memory Stores** | Videos, Questions, Employees — mutable arrays with getter/setter functions in `src/mocks/` |
| **localStorage** | Progress data (persisted with version migration), Auth session |
| **React hooks** | `useState`, `useMemo`, `useCallback`, `useRef`, `useEffect` — the classics. No external state library. |

### Dependencies (from package.json)

| Package | Purpose | Status |
|---|---|---|
| `react-router-dom` ^7.6.3 | Client-side routing | Active |
| `i18next` ^25.3.2 + `react-i18next` ^15.6.0 | Internationalization (scaffolded, not heavily used yet) | Standby |
| `@supabase/supabase-js` 2.57.4 | Supabase client (imported but not connected) | Standby |
| `@stripe/react-stripe-js` 4.0.2 | Stripe payments (not used) | Standby |
| `recharts` 3.2.0 | Charting library (installed, not used yet) | Standby |
| `lucide-react` ^0.469.0 | Icon library alternative (installed, not used) | Standby |
| `firebase` 12.0.0 | Firebase (not used) | Standby |

### What's NOT Connected Yet

- **Supabase** — real auth, database, edge functions are all ready to plug in but not connected
- **Shopify** — not needed for this project
- **Stripe** — not needed for this project

---

## 3. Architecture & File Structure

```
PROJECT_ROOT/
├── index.html                    # Entry HTML — SEO tags, font CDNs, icon CDNs
├── package.json                  # Dependencies & scripts
├── tailwind.config.ts            # Tailwind theme (StyleSystem color scales + fonts)
├── project_plan.md               # Original project plan (kept in sync)
├── PROJECT_HANDBOOK.md           # This document
│
├── src/
│   ├── main.tsx                  # ReactDOM.createRoot entry
│   ├── App.tsx                   # BrowserRouter + AuthProvider + I18nextProvider
│   ├── index.css                 # Global styles + StyleSystem CSS vars + animations
│   │
│   ├── hooks/
│   │   └── useAuth.tsx           # AuthContext: user state, login/logout, localStorage persistence
│   │
│   ├── components/
│   │   ├── base/                 # (empty — add shared UI primitives here)
│   │   └── feature/
│   │       └── AdminSidebar.tsx  # Left sidebar nav for all admin pages
│   │
│   ├── pages/
│   │   ├── login/page.tsx        # Employee login
│   │   ├── dashboard/page.tsx    # Employee dashboard (video list + progress)
│   │   ├── learn/
│   │   │   ├── page.tsx          # Video player + MCQ quiz orchestrator
│   │   │   └── components/
│   │   │       ├── VideoPlayer.tsx    # Veed.io iframe embed + completion button
│   │   │       ├── MCQQuiz.tsx        # Multiple-choice quiz form
│   │   │       └── QuizResult.tsx     # Pass/fail modal overlay
│   │   ├── admin/
│   │   │   ├── login/page.tsx         # Admin login
│   │   │   ├── dashboard/page.tsx     # Admin overview stats + employee table
│   │   │   ├── videos/page.tsx        # Video CRUD (right-side drawer pattern)
│   │   │   ├── questions/page.tsx     # MCQ CRUD (right-side drawer pattern)
│   │   │   ├── employees/page.tsx     # Employee CRUD (right-side drawer pattern)
│   │   │   └── reports/page.tsx       # Analytics: KPI cards, designation/store breakdown, at-risk, top performers
│   │   └── NotFound.tsx          # 404 page
│   │
│   ├── router/
│   │   ├── index.ts             # AppRoutes component + window.REACT_APP_NAVIGATE global
│   │   └── config.tsx           # Route definitions (RouteObject[])
│   │
│   ├── mocks/                    # Mock data layer (all data lives here until Supabase)
│   │   ├── designations.ts      # Designation type + list of 9 departments
│   │   ├── employees.ts         # Employee interface + 19 mock employees
│   │   ├── videos.ts            # Video interface + 23 mock videos across 9 designations
│   │   ├── questions.ts         # Question interface + 73 mock MCQ questions
│   │   ├── progress.ts          # Progress types + defaultProgress (realistic demo data)
│   │   ├── employeeStore.ts     # Mutable in-memory employee store (CRUD + queries)
│   │   ├── videoStore.ts        # Mutable in-memory video store (CRUD + queries)
│   │   ├── questionStore.ts     # Mutable in-memory question store (CRUD + queries)
│   │   └── progressStore.ts     # localStorage-backed progress store (CRUD + version migration)
│   │
│   ├── utils/
│   │   └── csvExport.ts         # CSV download utility (BOM prefix for Excel, proper escaping)
│   │
│   └── i18n/                    # Internationalization setup (scaffolded)
│       ├── index.ts
│       └── local/index.ts
```

### Import Path Rules

- **Same directory**: `./component`
- **Cross-directory**: `@/hooks/useAuth` (maps to `src/`)
- **Never use**: `../` or `../../`

---

## 4. Data Models

### Employee
```typescript
interface Employee {
  id: string;           // e.g., "emp-001" or "admin-001"
  email: string;        // Used as login identifier
  name: string;         // Full name
  designation: string;  // One of 9 designations
  avatar: string;       // 2-letter initials used in avatar circles
  role: 'employee' | 'admin';
  storeId: string;      // Store code, e.g., "ST-HSR"
  storeName: string;    // e.g., "Suvidha - Hisar"
}
```

### Video
```typescript
interface Video {
  id: string;           // e.g., "vid-001"
  title: string;        // Display title
  veedUrl: string;      // Veed.io embed URL (iframe src)
  designation: string;  // Target department
  sortOrder: number;    // Sequence within designation (1-based)
  duration: string;     // Human-readable, e.g., "12:34"
  thumbnail: string;    // Image URL (Stable Diffusion generated)
}
```

### Question
```typescript
interface Question {
  id: string;           // e.g., "q-001"
  videoId: string;      // FK to Video
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;     // Optional 5th option
  correctOption: 'a' | 'b' | 'c' | 'd' | 'e';
  sortOrder: number;    // Sequence within quiz
}
```

### Progress
```typescript
type ProgressStatus = 'locked' | 'unlocked' | 'completed';

interface QuizAttempt {
  attemptNumber: number;       // 1-based
  score: number;               // Number correct
  totalQuestions: number;
  answers: Record<string, string>;  // questionId → selected option
  passed: boolean;
  timestamp: string;           // ISO 8601
}

interface EmployeeProgress {
  employeeId: string;
  videoId: string;
  status: ProgressStatus;
  attempts: number;            // Total quiz attempts (denormalized from attemptHistory)
  completedAt?: string;        // ISO 8601, set when status becomes 'completed'
  attemptHistory: QuizAttempt[];  // Full history, newest last
}
```

---

## 5. Data Stores (State Management)

### Pattern

Each domain has two files:
1. **Type + mock data** (`src/mocks/employees.ts`, `videos.ts`, etc.) — defines the interface and exports static mock data
2. **Store** (`src/mocks/employeeStore.ts`, `videoStore.ts`, etc.) — mutable in-memory array with CRUD functions

### Employee Store (`employeeStore.ts`)
- **Storage**: In-memory array (volatile — admin CRUD changes lost on refresh)
- **Functions**: `getAllEmployees()`, `getEmployeeById()`, `findEmployeeByEmail()`, `addEmployee()`, `updateEmployee()`, `deleteEmployee()`, `getNextEmployeeId()`, `getEmployeesByDesignation()`, `getEmployeeCount()`, `getAllStores()`, `getEmployeesByStore()`

### Video Store (`videoStore.ts`)
- **Storage**: In-memory array (volatile — admin CRUD changes lost on refresh)
- **Functions**: `getAllVideos()`, `getVideoById()`, `addVideo()`, `updateVideo()`, `deleteVideo()`, `getNextVideoId()`

### Question Store (`questionStore.ts`)
- **Storage**: In-memory array (volatile — admin CRUD changes lost on refresh)
- **Functions**: `getAllQuestions()`, `getQuestionsByVideoId()`, `getQuestionById()`, `addQuestion()`, `updateQuestion()`, `deleteQuestion()`, `getNextQuestionId()`

### Progress Store (`progressStore.ts`)
- **Storage**: `localStorage` (key: `stu_progress`) with version migration (`stu_progress_version` → `DATA_VERSION = 2`)
- **Persistence**: Employee quiz progress *survives page refresh*
- **Functions**:
  - `getProgressForEmployee(employeeId)` — all progress for one employee
  - `getVideoProgress(employeeId, videoId)` — single entry
  - `markVideoCompleted(employeeId, videoId)` — sets status to 'completed'
  - `markVideoAttempted(employeeId, videoId)` — increments `attempts`
  - `recordAttempt(employeeId, videoId, score, totalQuestions, answers, passed)` — adds to `attemptHistory`
  - `unlockNextVideo(employeeId, currentVideoId)` — finds next video in sequence, unlocks it
  - `getAllEmployeeProgress()` — returns `{ employee: Employee, progress: EmployeeProgress[] }[]` — **this is the main data hook for admin reports**

---

## 6. Authentication System

### How It Works (Current Mock Implementation)

1. **Login**: Employee enters email → `useAuth.login(email)` calls `findEmployeeByEmail()` against the mock employee list
2. **Session persistence**: Successful login stores the full `Employee` object in `localStorage` under key `stu_emp`
3. **Page refresh**: `AuthProvider` reads `localStorage` on mount, restores the session
4. **Logout**: Clears `localStorage` and resets state
5. **Route protection**: Each protected page checks `useAuth().isAuthenticated` and redirects to login if false
6. **Role-based routing**: Employee pages redirect admins to `/admin/dashboard`; admin pages redirect employees away

### Login Flow Detail

```
User enters email
  → findEmployeeByEmail(email)
  → If found: set user state, persist to localStorage, redirect by role
  → If not found: show error
```

### To Migrate to Supabase Auth

- Replace `findEmployeeByEmail()` with Supabase `signInWithPassword()`
- Replace `localStorage` session with Supabase session (`supabase.auth.getSession()`)
- Add `onAuthStateChange` listener for real-time session updates
- Add RLS policies so users can only read their own progress
- Keep the same `AuthContext` interface — the migration is a drop-in replacement for the `login`/`logout` functions

---

## 7. Route Map

| Path | Page | Auth Required | Role |
|---|---|---|---|
| `/` | Employee Login | No | — |
| `/dashboard` | Employee Dashboard | Yes | employee |
| `/learn/:videoId` | Video + Quiz | Yes | employee |
| `/admin` | Admin Login | No | — |
| `/admin/dashboard` | Admin Overview | Yes | admin |
| `/admin/videos` | Video CRUD | Yes | admin |
| `/admin/questions` | Question CRUD | Yes | admin |
| `/admin/employees` | Employee CRUD | Yes | admin |
| `/admin/reports` | Analytics & Reports | Yes | admin |
| `*` | 404 Not Found | No | — |

---

## 8. Report Calculations — Detailed Breakdown

> **File**: `src/pages/admin/reports/page.tsx`
> **Period Filter**: All calculations support 3 periods — "Last 30 Days", "Last 90 Days", "All Time". The filter applies to `attemptHistory` timestamps and recalculates status from filtered history.

---

### 8.1 Period Filtering (`filterByPeriod`)

```
Input: EmployeeProgress[], period ("30d" | "90d" | "all")
Output: EmployeeProgress[] with filtered attemptHistory

Algorithm:
  1. If period === "all": return data unchanged
  2. Compute cutoff date: new Date() minus 30 or 90 days
  3. For each progress entry:
     a. Filter attemptHistory to only attempts with timestamp >= cutoff
     b. Find the LAST passed attempt in filtered history
     c. If one exists → status = "completed"
        Else if filtered history has any entries → status = "unlocked"
        Else → keep original status
     d. Recalculate attempts = filteredHistory.length
```

**Key implication**: If an employee completed a video 45 days ago and the period is "Last 30 Days", that completion is NOT counted. The video reverts to its pre-completion status for the report.

---

### 8.2 Top-Level Data Preparation

```
employeeProgress = rawEmployeeProgress.map(ep => ({
  employee: ep.employee,
  progress: filterByPeriod(ep.progress, period)
}))
```

This is the single source of truth all report sections derive from. Every calculation below starts from this array.

---

### 8.3 KPI Summary Cards (`kpiStats`)

Five summary metrics displayed at the top of the reports page:

#### a) Overall Completion Rate
```
totalAssignments = sum of all progress entries across all employees
totalCompleted   = count of progress entries where status === "completed"

overallCompletionPct = round((totalCompleted / totalAssignments) × 100)
```
*(Returns 0 if totalAssignments is 0)*

#### b) Employees at 100%
```
Count of employees where ALL assigned videos are completed.
(This is derived from topPerformers.length — see 8.6)
```
Shown as "X/Y" where Y is total employee count.

#### c) First-Try Pass Rate
```
For each progress entry with attemptHistory.length > 0:
  totalWithAttempts++
  if attemptHistory[0].passed === true:
    totalPassedFirstTry++

firstTryPassRate = round((totalPassedFirstTry / totalWithAttempts) × 100)
```
*(Returns 0 if totalWithAttempts is 0)*

**Note**: `attemptHistory[0]` is the FIRST attempt (index 0). This measures how often employees pass on their very first try.

#### d) Total Quiz Attempts
```
Sum of progress.attempts across all progress entries.
```
This is a simple sum — counts every quiz attempt ever made in the period.

#### e) At-Risk Count
```
Count of atRiskEmployees (see 8.5)
```

---

### 8.4 Performance Breakdown — Designation View (`designationReport`)

Groups all data by **designation** (department) and computes per-designation metrics:

```
For each designation:
  1. Gather all employees of that designation
  2. For each employee, gather their progress entries

  3. employeeCount = number of employees in this designation

  4. totalAssignments = sum of all progress entries
  5. completedCount   = count where status === "completed"

  6. completionPct = round((completedCount / totalAssignments) × 100)

  7. Best Store:
     Group employees by storeId.
     For each store: compute storePct from that store's employees in this designation.
     Pick the store with the highest storePct.
     → bestStore = { storeName, pct }

  8. atRiskCount:
     Count how many employees in this designation appear in atRiskEmployees (see 8.5)

Sort by: completionPct descending
```

---

### 8.5 Performance Breakdown — Store View (`storeReport`)

Groups all data by **store** (physical location) and computes per-store metrics:

```
For each store:
  1. Gather all employees at that store from employeeProgress
  2. For each employee, gather their progress entries

  3. employeeCount = number of employees at this store

  4. totalAssignments = sum of all progress entries
  5. completedCount   = count where status === "completed"

  6. completionPct = round((completedCount / totalAssignments) × 100)

  7. Per-employee completion percentages:
     For each employee:
       empTotal    = their progress.length
       empCompleted = count of their progress where status === "completed"
       empPct      = round((empCompleted / empTotal) × 100)

  8. bestEmployee = employee with highest empPct (sorted descending, pick first)

  9. needsAttention:
     sorted = employees sorted by empPct descending
     If the WORST employee (last in sorted) has empPct < 50%:
       needsAttention = that employee
     Else:
       needsAttention = null

Sort by: storeName alphabetically
```

**The `needsAttention` logic explained**: It flags the single lowest-performing employee at each store, but ONLY if they are below 50% completion. A store where everyone is above 50% shows no "needs attention".

---

### 8.6 At-Risk Employees (`atRiskEmployees`)

Identifies employees who are **stuck** — they have attempted a quiz but haven't passed it yet.

```
An employee is "at risk" if they have ANY progress entry where:
  status !== "completed" AND attempts > 0

For each at-risk employee:
  stuckVideos = progress entries matching above condition
  stuckCount  = stuckVideos.length
  
  totalVideos = total progress entries for this employee
  completed   = progress entries where status === "completed"
  completionPct = round((completed / totalVideos) × 100)

  stuckVideoTitles = for each stuck video, look up the video title by videoId

Sort by: completionPct ascending (worst first)
```

**UI display**: Shows at most 6 employees in the card, with a "+N more" indicator if there are more. Each at-risk employee shows the titles of their stuck videos (truncated to 28 chars, max 2 visible).

---

### 8.7 Top Performers (`topPerformers`)

Employees who have **completed ALL assigned videos**.

```
Filter employeeProgress to only employees where:
  total = progress.length
  completed = count where status === "completed"
  total > 0 AND completed === total

For each top performer:
  completed = total (by definition)

  avgPassRate:
    attemptsWithHistory = progress entries where attemptHistory.length > 0
    sumPassRate = sum of (last attempt passed? 1 : 0) for each
    avgPassRate = round((sumPassRate / attemptsWithHistory.length) × 100)

Sort by: avgPassRate descending (highest first-try rate at the top)
```

**Note on `avgPassRate`**: This is NOT the first-try pass rate. It checks the LAST attempt for each video (which for top performers is always the passing attempt, since they've completed everything). This is effectively 100% for most top performers unless there are edge cases.

---

### 8.8 CSV Export (`csvExport.ts`)

All report tables support CSV download:
- **Store report**: 10 columns (store ID, name, employees, assignments, completed, %, top employee, top %, needs attention, at-risk %)
- **At-risk employees**: 8 columns (name, store, designation, completed, total videos, %, stuck count, stuck titles)
- **Top performers**: 6 columns (name, store, designation, completed, total videos, first-try pass rate)
- **Designation report**: 8 columns (designation, employees, assignments, completed, %, best store, best store %, at-risk count)

CSV utility features:
- BOM prefix (`\uFEFF`) for Excel UTF-8 compatibility
- Proper escaping: fields containing commas, quotes, or newlines are wrapped in double quotes
- Quotes within fields are doubled (`""`)
- Blob created and downloaded via temporary anchor element, cleaned up with `URL.revokeObjectURL()`

---

## 9. Key Business Rules

### Sequential Video Unlock
1. Videos are assigned per designation with `sortOrder` (1, 2, 3...)
2. Initially, only `sortOrder === 1` is `unlocked`; all others are `locked`
3. After passing a quiz, `unlockNextVideo()` finds the next `sortOrder` in the same designation and changes its status from `locked` → `unlocked`
4. The `learn/:videoId` page refuses to render if `progress.status === 'locked'`

### Quiz Pass Criteria
- **Must score 100%** — `correctCount === totalQuestions`
- All answers submitted at once (not question-by-question)
- Every attempt is recorded in `attemptHistory` regardless of pass/fail
- Failed quizzes can be retaken immediately (no cooldown)

### Video Completion Gate
- Employee must click **"I've Finished Watching"** to unlock the quiz section
- This is client-side only (no server verification of watch time)
- The quiz section shows a locked state until the button is clicked

---

## 10. Design System (StyleSystem)

### Color Architecture

The project uses a **dynamic palette system** with 5 semantic roles:

| Role | Purpose | Anchor Token |
|---|---|---|
| `background` | Page base, cards, panels, section layers | `background-50` |
| `primary` | Main CTA, brand color, strongest actions | `primary-500` |
| `accent` | Secondary theme color, highlights, success states | `accent-500` |
| `secondary` | Supporting UI, filters, metadata, quiet actions | `secondary-500` |
| `foreground` | Text and neutral contrast | `foreground-950` (text), `foreground-500` (muted) |

Each role has an 11-step scale (50, 100, 200...950). Colors are defined as OKLCH channel values in `:root` CSS custom properties and consumed in Tailwind via `oklch(var(--token) / <alpha-value>)`.

**IMPORTANT**: Never hardcode hex/rgb/hsl colors. Always use the scale tokens. Dark mode is handled by `.dark` class overrides of the same variables — no code changes needed.

### Usage Pattern
```
Main CTA button:    bg-primary-500 text-background-50
Success/completion: bg-accent-500, text-accent-600, bg-accent-100
Supporting action:  bg-secondary-500, bg-secondary-100, text-secondary-700
Page background:    bg-background-50
Card/surface:       bg-background-50 border border-background-200
Main text:          text-foreground-900
Muted text:         text-foreground-500, text-foreground-400
```

### Typography
- Default: Inter, served via Google Fonts CDN
- CSS variables: `--font-heading`, `--font-body`, `--font-label`
- Tailwind classes: `font-heading` for titles, `font-body`/`font-sans` for body

---

## 11. Current State & Known Limitations

### What's Complete (Phases 1-3)

- [x] Employee login with mock auth + session persistence
- [x] Employee dashboard with designation-based video list + progress bar
- [x] Sequential video lock/unlock system
- [x] Video player (Veed.io iframe embed)
- [x] MCQ quiz with 100% pass requirement + retake support
- [x] Full attempt history tracking per employee per video
- [x] Admin login (separate from employee)
- [x] Admin dashboard with overview stats + employee progress table
- [x] Admin video CRUD with right-side drawer + inline validation
- [x] Admin question CRUD with right-side drawer + inline validation
- [x] Admin employee CRUD with right-side drawer + inline validation
- [x] Admin reports: KPI cards, designation/store breakdown, at-risk employees, top performers
- [x] CSV export for all report sections
- [x] Timer leak cleanup across admin pages
- [x] Mock data alignment (employees ↔ designations ↔ videos ↔ progress)
- [x] Responsive layout (desktop-first with mobile breakpoints)
- [x] 404 page

### Known Limitations (Will Be Addressed in Phase 4+)

1. **All data is mock** — Videos, questions, employees, and progress use hardcoded JavaScript data. Employee/video/question CRUD changes made in the admin panel are lost on page refresh (only progress persists via localStorage).

2. **No real authentication** — Anyone who knows an employee email can log in. No password. No session expiry. No token refresh.

3. **Single admin account** — Only `admin@suvidha.com` works. No admin user management.

4. **Video completion is trust-based** — Clicking "I've Finished Watching" is the only gate. No watch-time tracking. Could be enhanced with Veed.io API integration.

5. **No email notifications** — Employees aren't notified when new videos are assigned or when they fail quizzes.

6. **No password reset flow** — Not applicable with mock auth, but will need building when Supabase auth is added.

7. **Progress data is local-only** — Currently in `localStorage`. When Supabase is connected, progress will need to sync to the database and load from there instead.

---

## 12. Next Steps for the Team

### Immediate Priority: Phase 4 — Supabase Integration

This is the next logical phase. The data models are already designed; the frontend code uses clean store abstractions that map directly to database tables.

**Recommended approach:**

1. **Connect Supabase** — Set up project, get credentials
2. **Create database tables** — `users`, `videos`, `questions`, `progress` (schema in `project_plan.md` §4)
3. **Implement Supabase Auth** — Replace `useAuth.login()` with `signInWithPassword()`, add sign-up for admins
4. **Add RLS policies** — Employees can only read their own progress; admins can read/write all
5. **Replace mock stores** — Swap `employeeStore`, `videoStore`, `questionStore` with Supabase queries
6. **Sync progress** — Move from localStorage to Supabase `progress` table
7. **Add loading/error states** — Replace instant mock data with proper async loading

### Phase 5: Polish

- Animations on page transitions
- Responsive fixes for tablet breakpoints
- Proper error boundaries
- Form success/error toast notifications
- Accessibility audit
- SEO metadata for any public-facing pages

### Code Quality Notes

- **Timer cleanup**: All `setTimeout` calls in the codebase have proper `useRef` + `useEffect` cleanup. Follow this pattern for any new timers.
- **Store pattern**: All domain stores follow the same pattern — mutable array + exported getter/setter functions. Keep this consistency.
- **Drawer pattern**: Admin CRUD pages (videos, questions, employees) use the same right-side slide-in drawer with validation. Copy this pattern for any new admin CRUD pages.
- **No `../` imports**: Use `@/` prefix for cross-directory imports.

---

*End of document. Questions? Refer to `project_plan.md` for the original project specification and phase plan.*