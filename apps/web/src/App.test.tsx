import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('prototype student experience', () => {
  beforeEach(() => localStorage.clear());

  it('keeps answers, explanations, and difficulty out of the active quiz screen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /explore practice quizzes/i }));
    fireEvent.click(screen.getByRole('button', { name: /circuit theory: quick practice/i }));
    fireEvent.click(screen.getByRole('button', { name: /start practice quiz/i }));
    expect(screen.getByText(/question 01/i)).toBeInTheDocument();
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/difficulty level/i)).not.toBeInTheDocument();
  });

  it('requires an answer and explicit submission before moving to the next question', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /explore practice quizzes/i }));
    fireEvent.click(screen.getByRole('button', { name: /circuit theory: quick practice/i }));
    fireEvent.click(screen.getByRole('button', { name: /start practice quiz/i }));
    expect(screen.getByRole('button', { name: /submit answer/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /apply the core principle carefully/i }));
    expect(screen.getByText(/question 01/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit answer/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /ignore the input conditions/i }));
    expect(screen.getByRole('button', { name: /apply the core principle carefully/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /ignore the input conditions/i })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));
    expect(screen.getByText(/question 02/i)).toBeInTheDocument();
    const submitted = JSON.parse(localStorage.getItem('adaptiveiq-attempt-q-circuits') ?? '{}') as { answers: Record<string, number>; questionIds: string[] };
    expect(submitted.answers[submitted.questionIds[0]]).toBe(1);
  });

  it('saves answers on pause and resumes an active attempt', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /explore practice quizzes/i }));
    fireEvent.click(screen.getByRole('button', { name: /circuit theory: quick practice/i }));
    fireEvent.click(screen.getByRole('button', { name: /start practice quiz/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply the core principle carefully/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));
    const savedAttempt = JSON.parse(localStorage.getItem('adaptiveiq-attempt-q-circuits') ?? '{}') as { questionIds: string[] };
    expect(savedAttempt.questionIds[0]).toContain('-easy-');
    fireEvent.click(screen.getByRole('button', { name: /pause & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /practice quizzes/i }));
    fireEvent.click(screen.getByRole('button', { name: /circuit theory: quick practice/i }));
    expect(screen.getByRole('button', { name: /resume quiz/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /resume quiz/i }));
    expect(screen.getByText(/question 02/i)).toBeInTheDocument();
  });

  it('starts at Easy and uses the hidden adaptive difficulty to select the next question', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /explore practice quizzes/i }));
    fireEvent.click(screen.getByRole('button', { name: /circuit theory: quick practice/i }));
    fireEvent.click(screen.getByRole('button', { name: /start practice quiz/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply the core principle carefully/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));
    const initialAttempt = JSON.parse(localStorage.getItem('adaptiveiq-attempt-q-circuits') ?? '{}') as { questionIds: string[] };
    expect(initialAttempt.questionIds[0]).toContain('-easy-');
    for (let answer = 0; answer < 2; answer += 1) {
      fireEvent.click(screen.getByRole('button', { name: /apply the core principle carefully/i }));
      fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));
    }
    expect(screen.getByText(/question 04/i)).toBeInTheDocument();
    const advancedAttempt = JSON.parse(localStorage.getItem('adaptiveiq-attempt-q-circuits') ?? '{}') as { questionIds: string[] };
    expect(advancedAttempt.questionIds[3]).toContain('-medium-');
    expect(screen.queryByText(/medium/i)).not.toBeInTheDocument();
  });

  it('does not display another college’s quiz', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /explore practice quizzes/i }));
    expect(screen.queryByText(/operating systems: processes/i)).not.toBeInTheDocument();
  });

  it('shows electrical and computing subject scenes for their quizzes', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /explore practice quizzes/i }));
    expect(container.querySelector('.electric-scene')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: /preview as role/i }), { target: { value: 'Teacher' } });
    fireEvent.click(screen.getByRole('button', { name: /my quizzes/i }));
    fireEvent.click(screen.getByRole('button', { name: /data structures foundations/i }));
    expect(container.querySelector('.computing-scene')).toBeInTheDocument();
  });

  it('keeps names outside the top ten private while showing the current student result', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Leaderboards' }));
    const board = screen.getByText(/top performers/i).closest('.panel');
    expect(board).not.toBeNull();
    expect(within(board as HTMLElement).getByText('Aarav Kulkarni')).toBeInTheDocument();
    expect(within(board as HTMLElement).getByText('Your result')).toBeInTheDocument();
    expect(within(board as HTMLElement).queryByText('Kavya Patil')).not.toBeInTheDocument();
  });

  it('does not create a teacher quiz until its required question set is complete', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: /preview as role/i }), { target: { value: 'Teacher' } });
    fireEvent.click(screen.getByRole('button', { name: /create quiz/i }));
    fireEvent.change(screen.getByPlaceholderText(/circuit theory — chapter 3 practice/i), { target: { value: 'Networks practice' } });
    fireEvent.change(screen.getByPlaceholderText(/arrays, linked lists/i), { target: { value: 'Networks, Thevenin theorem' } });
    fireEvent.click(screen.getByRole('button', { name: /create practice quiz/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add at least 14 question(s) for each difficulty: Easy, Medium, Hard.');
  });
});
