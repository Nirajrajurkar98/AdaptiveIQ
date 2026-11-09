import type { Difficulty } from './types';

export interface AdaptiveState { difficulty: Difficulty; correctStreak: number; incorrectStreak: number; }
export const initialAdaptiveState: AdaptiveState = { difficulty: 'Easy', correctStreak: 0, incorrectStreak: 0 };
const levels: Difficulty[] = ['Easy', 'Medium', 'Hard'];

/** Applies the approved practice-mode streak rules and clamps at Easy/Hard. */
export function advanceAdaptiveState(state: AdaptiveState, correct: boolean): AdaptiveState {
  let index = levels.indexOf(state.difficulty);
  if (correct) {
    const streak = state.correctStreak + 1;
    if (streak === 3) index = Math.min(index + 1, levels.length - 1);
    return { difficulty: levels[index], correctStreak: streak === 3 ? 0 : streak, incorrectStreak: 0 };
  }
  const streak = state.incorrectStreak + 1;
  if (streak === 2) index = Math.max(index - 1, 0);
  return { difficulty: levels[index], correctStreak: 0, incorrectStreak: streak === 2 ? 0 : streak };
}
