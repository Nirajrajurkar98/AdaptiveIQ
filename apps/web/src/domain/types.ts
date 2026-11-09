export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Role = 'Student' | 'Teacher';
export type QuizStatus = 'Upcoming' | 'Active' | 'Expired';

export interface Question {
  id: string; topic: string; difficulty: Difficulty; prompt: string;
  options: [string, string, string, string]; correctIndex: number; explanation: string;
}
export interface Quiz {
  id: string; title: string; description: string; subject: string; topics: string[];
  collegeId: string; department?: string; className?: string; section?: string;
  startAt: string; endAt: string; questionCount: number; attemptLimit: number;
  questions: Question[]; participants: number; completed: number; status: QuizStatus;
}
export interface LeaderboardEntry { studentId: string; name: string; score: number; durationSeconds: number; }
