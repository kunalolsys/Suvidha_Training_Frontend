# Suvidha Training University (STU)

## 1. Project Description
An internal staff training portal where employees log in, are assigned sequential training videos based on their designation, and must pass MCQ quizzes after each video to unlock the next one. Admins manage videos and MCQs through a separate admin panel.

- **Target Users**: Employees across 9 designations (Sales, Operations, HR, IT, Finance, Front Desk, Housekeeping, Management, Kitchen Staff)
- **Core Value**: Structured, designation-specific training with enforced assessment to ensure knowledge retention

## 2. Page Structure

### Employee Portal
- `/` - Employee Login
- `/dashboard` - Employee Dashboard (video list by designation, progress overview)
- `/learn/:videoId` - Video Player + MCQ Quiz page

### Admin Portal
- `/admin` - Admin Login
- `/admin/dashboard` - Admin Dashboard (overview stats)
- `/admin/videos` - Manage Videos (add/edit/delete, assign to designation)
- `/admin/questions` - Manage MCQs (add/edit/delete, link to videos)

## 3. Core Features
- [x] Employee Login (mock auth for now)
- [x] Role-based video assignment by designation
- [x] Sequential video unlock system
- [x] Video playback (veed.io embed links)
- [x] MCQ quiz after each video (3-5 questions)
- [x] Pass/Fail logic + retake requirement
- [x] Progress tracking per employee
- [ ] Admin login (separate)
- [ ] Admin video management (CRUD + designation assignment)
- [ ] Admin MCQ management (CRUD + video linking)
- [x] Admin reports dashboard (store performance, at-risk employees, top performers, designation breakdown)

## 4. Data Model Design
(To be implemented with Supabase in later phases)

### Table: users
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| email | text | Employee email |
| name | text | Employee name |
| designation | text | Department/role |
| role | text | 'employee' or 'admin' |
| created_at | timestamp | Account creation date |

### Table: videos
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| title | text | Video title |
| veed_url | text | Veed.io embed link |
| designation | text | Target designation |
| sort_order | int | Sequence within designation |
| created_at | timestamp | Upload date |

### Table: questions
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| video_id | uuid | FK to videos |
| question_text | text | The MCQ question |
| option_a | text | Option A |
| option_b | text | Option B |
| option_c | text | Option C |
| option_d | text | Option D |
| option_e | text | Option E (nullable) |
| correct_option | text | 'a','b','c','d','e' |
| sort_order | int | Question sequence |

### Table: progress
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to users |
| video_id | uuid | FK to videos |
| status | text | 'locked','unlocked','completed' |
| attempts | int | Number of MCQ attempts |
| completed_at | timestamp | When passed |

## 5. Backend / Third-party Integration Plan
- **Supabase**: Required for authentication, database (users, videos, questions, progress), and potentially edge functions for admin operations
- **Veed.io**: Embedded video player via iframe/embed links (no API integration needed, just URL storage)
- **Shopify/Stripe**: Not needed

## 6. Development Phase Plan

### Phase 1: Employee Portal - Login + Dashboard
- Goal: Build the employee-facing login page and dashboard with mock data
- Deliverable: Login page (UI only), Dashboard showing designation-based video list with progress indicators, sequential lock/unlock UI
- Status: Completed

### Phase 2: Video Player + MCQ Quiz Flow
- Goal: Build the learning page with veed.io video embed and MCQ quiz system
- Deliverable: Video player page, MCQ quiz component, pass/fail feedback, retake logic, next video unlock
- Status: Completed

### Phase 3: Admin Portal
- Goal: Build the complete admin panel for managing content
- Deliverable: Admin login, admin dashboard, video CRUD, MCQ CRUD with video linking
- Status: Completed

### Phase 4: Supabase Integration
- Goal: Connect real authentication and database
- Deliverable: Supabase auth (employee + admin), database tables, RLS policies, real data fetching
- Status: Not started

### Phase 5: Polish & Finalize
- Goal: Animations, responsive fixes, error handling, final testing
- Deliverable: Production-ready training portal
- Status: Not started