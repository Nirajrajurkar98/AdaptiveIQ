import { describe, expect, it } from 'vitest';
import { advanceAdaptiveState, initialAdaptiveState, type AdaptiveState } from './adaptive';
import { rankEntries, visibleLeaderboard } from './leaderboard';
import { calculateResults, canStartOrResume, getQuizStatus, nextQuestionIndex } from './quiz';
import { chooseNextQuestion, requiredQuestionsPerDifficulty, validateQuestionPool } from './questionPool';
import { resolveSubjectSceneKind } from './subjectScene';
import { leaderboardEntries, quizzes } from '../data/mockData';

describe('adaptive practice rules', () => {
  it('moves up after three consecutive correct answers and resets an incorrect streak', () => {
    let state = initialAdaptiveState;
    state = advanceAdaptiveState(state, true); state = advanceAdaptiveState(state, true);
    expect(state.correctStreak).toBe(2);
    state = advanceAdaptiveState(state, false);
    expect(state).toEqual({ difficulty: 'Easy', correctStreak: 0, incorrectStreak: 1 });
    state = advanceAdaptiveState(state, true); state = advanceAdaptiveState(state, true); state = advanceAdaptiveState(state, true);
    expect(state).toEqual({ difficulty: 'Medium', correctStreak: 0, incorrectStreak: 0 });
  });
  it('moves down after two consecutive incorrect answers, reset by a correct answer', () => {
    let state: AdaptiveState = { difficulty: 'Medium', correctStreak: 0, incorrectStreak: 1 };
    state = advanceAdaptiveState(state, true);
    expect(state).toEqual({ difficulty: 'Medium', correctStreak: 1, incorrectStreak: 0 });
    state = advanceAdaptiveState(state, false); expect(state.incorrectStreak).toBe(1);
    state = advanceAdaptiveState(state, false);
    expect(state).toEqual({ difficulty: 'Easy', correctStreak: 0, incorrectStreak: 0 });
  });
  it('clamps difficulty at Easy and Hard', () => {
    let easy: AdaptiveState = { difficulty: 'Easy', correctStreak: 0, incorrectStreak: 1 };
    easy = advanceAdaptiveState(easy, false); expect(easy.difficulty).toBe('Easy');
    let hard: AdaptiveState = { difficulty: 'Hard', correctStreak: 2, incorrectStreak: 0 };
    hard = advanceAdaptiveState(hard, true); expect(hard.difficulty).toBe('Hard');
  });
});

describe('quiz rules', () => {
  it('requires the rounded-up 70% minimum from each difficulty pool', () => {
    expect(requiredQuestionsPerDifficulty(20)).toBe(14);
    expect(requiredQuestionsPerDifficulty(25)).toBe(18);
    const questions = quizzes[0].questions;
    expect(validateQuestionPool(questions, 20)).toMatchObject({ valid: true, requiredEach: 14, missing: [] });
    expect(validateQuestionPool(questions.slice(0, 41), 20)).toMatchObject({ valid: false, missing: ['Hard'] });
  });
  it('randomly chooses an unused question at the target difficulty and falls back when exhausted', () => {
    const questions = quizzes[0].questions;
    const easy = chooseNextQuestion(questions, 'Easy', [], () => 0);
    expect(easy?.difficulty).toBe('Easy');
    expect(chooseNextQuestion(questions, 'Easy', [easy!.id], () => 0)?.id).not.toBe(easy?.id);
    const allEasyIds = questions.filter((question) => question.difficulty === 'Easy').map((question) => question.id);
    expect(chooseNextQuestion(questions, 'Easy', allEasyIds, () => 0)?.difficulty).toBe('Medium');
  });
  it('does not count unanswered questions as correct', () => {
    const questions = quizzes[0].questions.slice(0, 3);
    const result = calculateResults(questions, { [questions[0].id]: questions[0].correctIndex, [questions[1].id]: 1 });
    expect(result).toMatchObject({ total: 3, correct: 1, incorrect: 1, unanswered: 1, accuracy: 33 });
  });
  it('enforces active status and attempt limit while allowing an active attempt to resume', () => {
    expect(canStartOrResume('Active', 1, 1, false)).toBe(false);
    expect(canStartOrResume('Active', 1, 1, true)).toBe(true);
    expect(canStartOrResume('Expired', 0, 1, true)).toBe(false);
  });
  it('derives scheduled status from the date window', () => {
    const quiz = quizzes[0];
    expect(getQuizStatus(quiz, new Date(quiz.startAt).getTime() - 1)).toBe('Upcoming');
    expect(getQuizStatus(quiz, new Date(quiz.startAt).getTime() + 1)).toBe('Active');
    expect(getQuizStatus(quiz, new Date(quiz.endAt).getTime() + 1)).toBe('Expired');
  });
  it('selects an unanswered question at the adaptive target difficulty, then falls back if none remain', () => {
    const questions = quizzes[0].questions;
    const mediumIndex = nextQuestionIndex(questions, {}, 'Medium');
    expect(questions[mediumIndex].difficulty).toBe('Medium');
    const allMediumAnswered = Object.fromEntries(questions.filter((question) => question.difficulty === 'Medium').map((question) => [question.id, 0]));
    const fallbackIndex = nextQuestionIndex(questions, allMediumAnswered, 'Medium');
    expect(questions[fallbackIndex].difficulty).toBe('Easy');
  });
});

describe('subject showcase catalog', () => {
  it('provides ten sample subject quizzes with all required difficulty pools', () => {
    const showcaseIds = ['q-cs-it', 'q-dsa', 'q-ai-ml', 'q-cyber', 'q-math-foundations', 'q-mechanical', 'q-civil', 'q-electronics', 'q-physics', 'q-chemistry'];
    const showcase = quizzes.filter((quiz) => showcaseIds.includes(quiz.id));
    expect(showcase).toHaveLength(10);
    for (const quiz of showcase) expect(validateQuestionPool(quiz.questions, quiz.questionCount).valid).toBe(true);
  });
});

describe('quiz-title animation selection', () => {
  it('uses recognizable quiz-title keywords before the broader subject fallback', () => {
    expect(resolveSubjectSceneKind({ title: 'Circuit Theory Practice', subject: 'Computer Engineering', topics: [] })).toBe('electric');
    expect(resolveSubjectSceneKind({ title: 'Neural Network Foundations', subject: 'Computer Science & IT', topics: [] })).toBe('ai');
    expect(resolveSubjectSceneKind({ title: 'General Revision', subject: 'Electrical Engineering', topics: [] })).toBe('electric');
    expect(resolveSubjectSceneKind({ title: 'General Revision', subject: 'Open Electives', topics: [] })).toBe('general');
  });
});

describe('leaderboard privacy and ranking', () => {
  it('uses competition ranks for equal scores and completion times', () => {
    const ranked = rankEntries([
      { studentId: 'a', name: 'A', score: 9, durationSeconds: 100 },
      { studentId: 'b', name: 'B', score: 8, durationSeconds: 100 },
      { studentId: 'c', name: 'C', score: 8, durationSeconds: 100 },
      { studentId: 'd', name: 'D', score: 7, durationSeconds: 90 },
    ]);
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 2, 4]);
  });
  it('shows only the top ten and the current student outside that range', () => {
    const view = visibleLeaderboard(leaderboardEntries, 's11');
    expect(view.topTen).toHaveLength(10);
    expect(view.ownEntry?.rank).toBe(11);
    expect(view.topTen.some((entry) => entry.studentId === 's12')).toBe(false);
    expect(view.totalAttempts).toBe(12);
  });
  it('excludes quizzes for another college from college-scoped mock data', () => {
    const visible = quizzes.filter((quiz) => quiz.collegeId === 'sanjivani');
    expect(visible.map((quiz) => quiz.id)).not.toContain('q-os');
  });
});
