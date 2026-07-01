import { questions as initialQuestions, type Question } from '@/mocks/questions';

let questionStore = [...initialQuestions];

export function getAllQuestions(): Question[] {
  return [...questionStore];
}

export function getQuestionsByVideoId(videoId: string): Question[] {
  return questionStore.filter((q) => q.videoId === videoId);
}

export function getQuestionById(id: string): Question | undefined {
  return questionStore.find((q) => q.id === id);
}

export function addQuestion(question: Question): void {
  questionStore = [...questionStore, question];
}

export function updateQuestion(id: string, updates: Partial<Question>): void {
  questionStore = questionStore.map((q) => (q.id === id ? { ...q, ...updates } : q));
}

export function deleteQuestion(id: string): void {
  questionStore = questionStore.filter((q) => q.id !== id);
}

export function getNextQuestionId(): string {
  const max = questionStore.reduce((acc, q) => {
    const num = parseInt(q.id.split('-')[1], 10);
    return Math.max(acc, num);
  }, 0);
  return `q-${String(max + 1).padStart(3, '0')}`;
}