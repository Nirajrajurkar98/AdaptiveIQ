import type { LeaderboardEntry, Question, Quiz } from '../domain/types';

const now = new Date();
const inDays = (days: number, hour: number) => { const date = new Date(now); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date.toISOString(); };
const makeQuestions = (count: number, topic: string): Question[] => Array.from({ length: count }, (_, index) => ({
  id: `${topic.toLowerCase().replace(/ /g, '-')}-${index + 1}`, topic: index % 2 ? topic : `${topic} basics`, difficulty: (['Easy', 'Medium', 'Hard'] as const)[Math.min(Math.floor(index / 7), 2)],
  prompt: [
    `Which statement best describes a key concept in ${topic}?`,
    `A system has an input of ${index + 2} units. Which approach gives a reliable ${topic} result?`,
    `What is the most appropriate next step when applying ${topic} in this scenario?`,
  ][index % 3],
  options: [`Apply the core principle carefully`, `Ignore the input conditions`, `Repeat the same operation without checking`, `Replace the method with an unrelated one`],
  correctIndex: 0, explanation: `The core principle of ${topic} is to use the given conditions and verify the result.`,
}));

export const quizzes: Quiz[] = [
  { id: 'q-circuits', title: 'Circuit Theory: Quick Practice', description: 'Build confidence with core circuit analysis concepts.', subject: 'Electrical Engineering', topics: ['Circuit Theory', 'Network Theorems'], collegeId: 'sanjivani', department: 'Electrical Engineering', className: 'Second Year', section: 'A', startAt: inDays(-1, 8), endAt: inDays(2, 23), questionCount: 20, attemptLimit: 2, questions: makeQuestions(20, 'Circuit Theory'), participants: 84, completed: 62, status: 'Active' },
  { id: 'q-data', title: 'Data Structures Foundations', description: 'Practice your understanding of linear data structures.', subject: 'Computer Engineering', topics: ['Arrays', 'Linked Lists'], collegeId: 'sanjivani', department: 'Computer Engineering', className: 'Second Year', section: 'B', startAt: inDays(1, 9), endAt: inDays(4, 18), questionCount: 20, attemptLimit: 1, questions: makeQuestions(20, 'Data Structures'), participants: 0, completed: 0, status: 'Upcoming' },
  { id: 'q-math', title: 'Engineering Mathematics II', description: 'A focused practice set on differential equations.', subject: 'Engineering Mathematics', topics: ['Differential Equations', 'Laplace Transform'], collegeId: 'sanjivani', department: 'Applied Sciences', className: 'First Year', section: 'C', startAt: inDays(-8, 9), endAt: inDays(-2, 18), questionCount: 20, attemptLimit: 3, questions: makeQuestions(20, 'Differential Equations'), participants: 126, completed: 117, status: 'Expired' },
  { id: 'q-os', title: 'Operating Systems: Processes', description: 'Review process scheduling and synchronization.', subject: 'Computer Engineering', topics: ['Processes', 'Scheduling'], collegeId: 'other-college', startAt: inDays(-1, 8), endAt: inDays(2, 23), questionCount: 20, attemptLimit: 1, questions: makeQuestions(20, 'Processes'), participants: 30, completed: 20, status: 'Active' },
];

export const leaderboardEntries: LeaderboardEntry[] = [
  ['s1', 'Aarav Kulkarni', 19, 842], ['s2', 'Ananya Patil', 18, 790], ['s3', 'Rohan Shinde', 18, 806], ['s4', 'Isha Deshmukh', 17, 725], ['s5', 'Vivek Pawar', 16, 660], ['s6', 'Sana Shaikh', 15, 703], ['s7', 'Om Jadhav', 15, 730], ['s8', 'Mira Joshi', 14, 682], ['s9', 'Atharv More', 14, 740], ['s10', 'Neha Bhosale', 13, 611], ['s11', 'You', 12, 605], ['s12', 'Kavya Patil', 10, 690],
].map(([studentId, name, score, durationSeconds]) => ({ studentId: String(studentId), name: String(name), score: Number(score), durationSeconds: Number(durationSeconds) }));

export const currentStudent = { id: 's11', name: 'Aarav', collegeId: 'sanjivani', department: 'Electrical Engineering', className: 'Second Year', section: 'A' };
