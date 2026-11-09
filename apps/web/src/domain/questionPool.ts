import type { Difficulty, Question } from './types';

export const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export function requiredQuestionsPerDifficulty(questionCount: number) {
  return Math.ceil(questionCount * 0.7);
}

export function countQuestionsByDifficulty(questions: Question[]): Record<Difficulty, number> {
  return {
    Easy: questions.filter((question) => question.difficulty === 'Easy').length,
    Medium: questions.filter((question) => question.difficulty === 'Medium').length,
    Hard: questions.filter((question) => question.difficulty === 'Hard').length,
  };
}

export function validateQuestionPool(questions: Question[], questionCount: number) {
  const counts = countQuestionsByDifficulty(questions);
  const requiredEach = requiredQuestionsPerDifficulty(questionCount);
  const missing = difficulties.filter((difficulty) => counts[difficulty] < requiredEach);
  return { valid: missing.length === 0, counts, requiredEach, missing };
}

/** Draw randomly from the requested level; if it is empty, use any remaining level. */
export function chooseNextQuestion(
  questions: Question[],
  target: Difficulty,
  usedIds: string[],
  random: () => number = Math.random,
): Question | undefined {
  const unused = questions.filter((question) => !usedIds.includes(question.id));
  const atTarget = unused.filter((question) => question.difficulty === target);
  const candidates = atTarget.length ? atTarget : unused;
  if (!candidates.length) return undefined;
  return candidates[Math.floor(random() * candidates.length)];
}
