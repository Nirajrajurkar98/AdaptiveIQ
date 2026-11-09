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

  it('saves answers on pause and resumes an active attempt', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /explore practice quizzes/i }));
    fireEvent.click(screen.getByRole('button', { name: /circuit theory: quick practice/i }));
    fireEvent.click(screen.getByRole('button', { name: /start practice quiz/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply the core principle carefully/i }));
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
    const initialAttempt = JSON.parse(localStorage.getItem('adaptiveiq-attempt-q-circuits') ?? '{}') as { questionIds: string[] };
    expect(initialAttempt.questionIds[0]).toContain('-easy-');
    for (let answer = 0; answer < 2; answer += 1) {
      fireEvent.click(screen.getByRole('button', { name: /apply the core principle carefully/i }));
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
