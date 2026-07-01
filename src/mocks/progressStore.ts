import type { EmployeeProgress, QuizAttempt } from '@/mocks/progress';
import { defaultProgress } from '@/mocks/progress';
import { videos as allVideos } from '@/mocks/videos';
import type { Employee } from '@/mocks/employees';
import { getAllEmployees } from '@/mocks/employeeStore';

const STORAGE_KEY = 'stu_progress';
const VERSION_KEY = 'stu_progress_version';
const DATA_VERSION = 2;

function loadProgress(): EmployeeProgress[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && version === String(DATA_VERSION)) {
      const parsed = JSON.parse(stored) as EmployeeProgress[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate old data without attemptHistory
        return parsed.map((p) => ({
          ...p,
          attemptHistory: p.attemptHistory ?? [],
        }));
      }
    }
  } catch {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProgress));
  localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
  return [...defaultProgress];
}

function saveProgress(progress: EmployeeProgress[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

let cachedProgress: EmployeeProgress[] | null = null;

function getAllProgress(): EmployeeProgress[] {
  if (!cachedProgress) {
    cachedProgress = loadProgress();
  }
  return cachedProgress;
}

export function getProgressForEmployee(employeeId: string): EmployeeProgress[] {
  return getAllProgress().filter((p) => p.employeeId === employeeId);
}

export function getVideoProgress(employeeId: string, videoId: string): EmployeeProgress | undefined {
  return getAllProgress().find((p) => p.employeeId === employeeId && p.videoId === videoId);
}

export function markVideoCompleted(employeeId: string, videoId: string): void {
  const all = getAllProgress();
  const entry = all.find((p) => p.employeeId === employeeId && p.videoId === videoId);
  if (entry) {
    entry.status = 'completed';
    entry.completedAt = new Date().toISOString();
    saveProgress(all);
  }
}

export function markVideoAttempted(employeeId: string, videoId: string): void {
  const all = getAllProgress();
  const entry = all.find((p) => p.employeeId === employeeId && p.videoId === videoId);
  if (entry) {
    entry.attempts += 1;
    saveProgress(all);
  }
}

export function recordAttempt(
  employeeId: string,
  videoId: string,
  score: number,
  totalQuestions: number,
  answers: Record<string, string>,
  passed: boolean,
): void {
  const all = getAllProgress();
  const entry = all.find((p) => p.employeeId === employeeId && p.videoId === videoId);
  if (!entry) return;

  entry.attempts += 1;
  const attempt: QuizAttempt = {
    attemptNumber: entry.attempts,
    score,
    totalQuestions,
    answers,
    passed,
    timestamp: new Date().toISOString(),
  };
  entry.attemptHistory = [...entry.attemptHistory, attempt];
  saveProgress(all);
}

export function unlockNextVideo(employeeId: string, currentVideoId: string): void {
  const all = getAllProgress();
  const currentVideo = allVideos.find((v) => v.id === currentVideoId);
  if (!currentVideo) return;

  const nextVideo = allVideos.find(
    (v) => v.designation === currentVideo.designation &&
      v.sortOrder === currentVideo.sortOrder + 1,
  );

  if (nextVideo) {
    const nextEntry = all.find(
      (p) => p.employeeId === employeeId && p.videoId === nextVideo.id,
    );
    if (nextEntry && nextEntry.status === 'locked') {
      nextEntry.status = 'unlocked';
      saveProgress(all);
    }
  }
}

export function clearProgressCache(): void {
  cachedProgress = null;
}

export function getAllProgressForAdmin(): EmployeeProgress[] {
  return getAllProgress();
}

export function getAllEmployeeProgress(): { employee: Employee; progress: EmployeeProgress[] }[] {
  const allProgress = getAllProgress();
  const allEmployees = getAllEmployees();
  return allEmployees.map((employee) => ({
    employee,
    progress: allProgress.filter((p) => p.employeeId === employee.id),
  }));
}