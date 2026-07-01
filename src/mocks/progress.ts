export interface QuizAttempt {
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  passed: boolean;
  timestamp: string;
}

export type ProgressStatus = 'locked' | 'unlocked' | 'completed';

export interface EmployeeProgress {
  employeeId: string;
  videoId: string;
  status: ProgressStatus;
  attempts: number;
  completedAt?: string;
  attemptHistory: QuizAttempt[];
}

// Default progress with realistic demo data so the admin dashboard isn't all zeros
export const defaultProgress: EmployeeProgress[] = [
  // Rajesh Kumar (Sales) — completed 2, failed 1 attempt on 3rd
  {
    employeeId: 'emp-001',
    videoId: 'vid-001',
    status: 'completed',
    attempts: 2,
    completedAt: '2026-06-20T10:30:00Z',
    attemptHistory: [
      {
        attemptNumber: 1,
        score: 2,
        totalQuestions: 5,
        answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'A' },
        passed: false,
        timestamp: '2026-06-18T14:00:00Z',
      },
      {
        attemptNumber: 2,
        score: 5,
        totalQuestions: 5,
        answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E' },
        passed: true,
        timestamp: '2026-06-20T10:30:00Z',
      },
    ],
  },
  { employeeId: 'emp-001', videoId: 'vid-002', status: 'completed', attempts: 1, completedAt: '2026-06-21T09:15:00Z', attemptHistory: [{ attemptNumber: 1, score: 4, totalQuestions: 4, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }, passed: true, timestamp: '2026-06-21T09:15:00Z' }] },
  { employeeId: 'emp-001', videoId: 'vid-003', status: 'unlocked', attempts: 1, attemptHistory: [{ attemptNumber: 1, score: 1, totalQuestions: 5, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'A' }, passed: false, timestamp: '2026-06-22T16:00:00Z' }] },
  { employeeId: 'emp-001', videoId: 'vid-004', status: 'locked', attempts: 0, attemptHistory: [] },

  // Priya Sharma (Operations) — completed 1
  {
    employeeId: 'emp-002',
    videoId: 'vid-005',
    status: 'completed',
    attempts: 1,
    completedAt: '2026-06-19T11:00:00Z',
    attemptHistory: [{ attemptNumber: 1, score: 5, totalQuestions: 5, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E' }, passed: true, timestamp: '2026-06-19T11:00:00Z' }],
  },
  { employeeId: 'emp-002', videoId: 'vid-006', status: 'unlocked', attempts: 0, attemptHistory: [] },
  { employeeId: 'emp-002', videoId: 'vid-007', status: 'locked', attempts: 0, attemptHistory: [] },

  // Amit Patel (Front Desk) — completed 1
  {
    employeeId: 'emp-003',
    videoId: 'vid-015',
    status: 'completed',
    attempts: 1,
    completedAt: '2026-06-15T09:30:00Z',
    attemptHistory: [{ attemptNumber: 1, score: 4, totalQuestions: 4, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }, passed: true, timestamp: '2026-06-15T09:30:00Z' }],
  },
  { employeeId: 'emp-003', videoId: 'vid-016', status: 'locked', attempts: 0, attemptHistory: [] },

  // Sneha Verma (HR) — completed 1, in progress on 2nd with 2 failed attempts
  {
    employeeId: 'emp-004',
    videoId: 'vid-008',
    status: 'completed',
    attempts: 1,
    completedAt: '2026-06-22T13:00:00Z',
    attemptHistory: [{ attemptNumber: 1, score: 5, totalQuestions: 5, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E' }, passed: true, timestamp: '2026-06-22T13:00:00Z' }],
  },
  {
    employeeId: 'emp-004',
    videoId: 'vid-009',
    status: 'unlocked',
    attempts: 2,
    attemptHistory: [
      { attemptNumber: 1, score: 1, totalQuestions: 5, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E' }, passed: false, timestamp: '2026-06-23T10:00:00Z' },
      { attemptNumber: 2, score: 2, totalQuestions: 5, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E' }, passed: false, timestamp: '2026-06-24T11:30:00Z' },
    ],
  },
  { employeeId: 'emp-004', videoId: 'vid-010', status: 'locked', attempts: 0, attemptHistory: [] },

  // Vikram Singh (Finance) — 1 failed attempt
  {
    employeeId: 'emp-005',
    videoId: 'vid-013',
    status: 'unlocked',
    attempts: 1,
    attemptHistory: [{ attemptNumber: 1, score: 1, totalQuestions: 4, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }, passed: false, timestamp: '2026-06-21T15:00:00Z' }],
  },
  { employeeId: 'emp-005', videoId: 'vid-014', status: 'locked', attempts: 0, attemptHistory: [] },

  // Anjali Desai (Kitchen Staff) — hasn't started
  { employeeId: 'emp-006', videoId: 'vid-022', status: 'unlocked', attempts: 0, attemptHistory: [] },
  { employeeId: 'emp-006', videoId: 'vid-023', status: 'locked', attempts: 0, attemptHistory: [] },

  // Sunil Yadav (Housekeeping) — completed 1
  {
    employeeId: 'emp-007',
    videoId: 'vid-017',
    status: 'completed',
    attempts: 1,
    completedAt: '2026-06-20T07:00:00Z',
    attemptHistory: [{ attemptNumber: 1, score: 3, totalQuestions: 3, answers: { q1: 'A', q2: 'B', q3: 'C' }, passed: true, timestamp: '2026-06-20T07:00:00Z' }],
  },
  { employeeId: 'emp-007', videoId: 'vid-018', status: 'locked', attempts: 0, attemptHistory: [] },

  // Meera Reddy (Management) — completed 2
  {
    employeeId: 'emp-008',
    videoId: 'vid-019',
    status: 'completed',
    attempts: 1,
    completedAt: '2026-06-16T12:00:00Z',
    attemptHistory: [{ attemptNumber: 1, score: 5, totalQuestions: 5, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E' }, passed: true, timestamp: '2026-06-16T12:00:00Z' }],
  },
  {
    employeeId: 'emp-008',
    videoId: 'vid-020',
    status: 'completed',
    attempts: 2,
    completedAt: '2026-06-18T09:00:00Z',
    attemptHistory: [
      { attemptNumber: 1, score: 2, totalQuestions: 4, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }, passed: false, timestamp: '2026-06-17T14:00:00Z' },
      { attemptNumber: 2, score: 4, totalQuestions: 4, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }, passed: true, timestamp: '2026-06-18T09:00:00Z' },
    ],
  },
  { employeeId: 'emp-008', videoId: 'vid-021', status: 'locked', attempts: 0, attemptHistory: [] },

  // Arjun Nair (IT) — completed 1
  {
    employeeId: 'emp-009',
    videoId: 'vid-011',
    status: 'completed',
    attempts: 1,
    completedAt: '2026-06-19T08:30:00Z',
    attemptHistory: [{ attemptNumber: 1, score: 4, totalQuestions: 4, answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }, passed: true, timestamp: '2026-06-19T08:30:00Z' }],
  },
  { employeeId: 'emp-009', videoId: 'vid-012', status: 'locked', attempts: 0, attemptHistory: [] },
];

export function getProgressForEmployee(employeeId: string): EmployeeProgress[] {
  return defaultProgress.filter((p) => p.employeeId === employeeId);
}