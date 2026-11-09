import type { Difficulty, Question, Quiz, QuizStatus } from './types';

export function getQuizStatus(quiz: Quiz, now = Date.now()): QuizStatus {
  if (now < new Date(quiz.startAt).getTime()) return 'Upcoming';
  if (now <= new Date(quiz.endAt).getTime()) return 'Active';
  return 'Expired';
}
export function calculateResults(questions: Question[], answers: Record<string, number>) {
  const correct = questions.filter((question) => answers[question.id] === question.correctIndex).length;
  const incorrect = questions.filter((question) => answers[question.id] !== undefined && answers[question.id] !== question.correctIndex).length;
  const unanswered = questions.length - correct - incorrect;
  const byDifficulty = Object.fromEntries((['Easy', 'Medium', 'Hard'] as const).map((difficulty) => {
    const group = questions.filter((question) => question.difficulty === difficulty);
    return [difficulty, { correct: group.filter((question) => answers[question.id] === question.correctIndex).length, total: group.length }];
  }));
  const byTopic = Object.fromEntries([...new Set(questions.map((question) => question.topic))].map((topic) => {
    const group = questions.filter((question) => question.topic === topic);
    return [topic, { correct: group.filter((question) => answers[question.id] === question.correctIndex).length, total: group.length }];
  }));
  return { total: questions.length, correct, incorrect, unanswered, score: correct, accuracy: questions.length ? Math.round((correct / questions.length) * 100) : 0, byDifficulty, byTopic };
}
/** Pick the next unanswered question at the adaptive target level when available. */
export function nextQuestionIndex(questions: Question[], answers: Record<string, number>, target: Difficulty) {
  const targetIndex = questions.findIndex((question) => question.difficulty === target && answers[question.id] === undefined);
  if (targetIndex >= 0) return targetIndex;
  return questions.findIndex((question) => answers[question.id] === undefined);
}
export function canStartOrResume(status: QuizStatus, attemptsUsed: number, attemptLimit: number, hasUnsubmittedAttempt: boolean) {
  if (status !== 'Active') return false;
  return hasUnsubmittedAttempt || attemptsUsed < attemptLimit;
}
