import type { LeaderboardEntry, Question, Quiz } from '../domain/types';

const now = new Date();
const inDays = (days: number, hour: number) => { const date = new Date(now); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date.toISOString(); };
const makeQuestionPool = (topic: string, countPerDifficulty: number): Question[] => (['Easy', 'Medium', 'Hard'] as const).flatMap((difficulty) => Array.from({ length: countPerDifficulty }, (_, index) => ({
  id: `${topic.toLowerCase().replace(/ /g, '-')}-${difficulty.toLowerCase()}-${index + 1}`, topic: index % 2 ? topic : `${topic} basics`, difficulty,
  prompt: [
    `Which statement best describes a key concept in ${topic}?`,
    `A system has an input of ${index + 2} units. Which approach gives a reliable ${topic} result?`,
    `What is the most appropriate next step when applying ${topic} in this scenario?`,
  ][index % 3],
  options: [`Apply the core principle carefully`, `Ignore the input conditions`, `Repeat the same operation without checking`, `Replace the method with an unrelated one`],
  correctIndex: 0, explanation: `The core principle of ${topic} is to use the given conditions and verify the result.`,
})));

const showcaseQuizDetails: Array<Pick<Quiz, 'id' | 'title' | 'subject' | 'topics' | 'description'>> = [
  { id: 'q-cs-it', title: 'Programming Foundations: Introduction to CS', subject: 'Computer Science & IT', topics: ['Programming', 'Algorithm Design'], description: 'Practice core programming concepts, algorithm thinking, and software foundations.' },
  { id: 'q-dsa', title: 'Data Structures & Algorithms', subject: 'Data Structures & Algorithms', topics: ['Arrays', 'Linked Lists', 'Trees'], description: 'Explore how common data structures organize information and support efficient algorithms.' },
  { id: 'q-ai-ml', title: 'Artificial Intelligence & Machine Learning', subject: 'Artificial Intelligence & Machine Learning', topics: ['Machine Learning', 'Model Training'], description: 'Review foundational AI and machine learning concepts through practical questions.' },
  { id: 'q-cyber', title: 'Cybersecurity Essentials', subject: 'Cybersecurity', topics: ['Network Security', 'Encryption'], description: 'Practice the fundamentals of protecting systems, data, and networks.' },
  { id: 'q-math-foundations', title: 'Discrete Mathematics Foundations', subject: 'Engineering Mathematics', topics: ['Logic', 'Set Theory', 'Combinatorics'], description: 'Strengthen logic, sets, and counting methods used throughout engineering.' },
  { id: 'q-mechanical', title: 'Mechanical Systems & Motion', subject: 'Mechanical Engineering', topics: ['Mechanics', 'Motion'], description: 'Apply core mechanics ideas to forces, motion, and machine systems.' },
  { id: 'q-civil', title: 'Civil Engineering: Structures', subject: 'Civil Engineering', topics: ['Structural Analysis', 'Materials'], description: 'Review structural behavior, load paths, and essential construction materials.' },
  { id: 'q-electronics', title: 'Digital Electronics & Communication', subject: 'Electronics & Communication Engineering', topics: ['Logic Circuits', 'Digital Signals'], description: 'Practice digital logic, electronic circuits, and communication fundamentals.' },
  { id: 'q-physics', title: 'Physics: Electricity & Magnetism', subject: 'Physics', topics: ['Electricity', 'Magnetism'], description: 'Explore electric fields, magnetic effects, and foundational physics principles.' },
  { id: 'q-chemistry', title: 'Engineering Chemistry: Materials', subject: 'Chemistry', topics: ['Materials', 'Chemical Bonds'], description: 'Review engineering materials, bonding, and applied chemistry concepts.' },
];

const showcaseQuizzes: Quiz[] = showcaseQuizDetails.map((details) => ({
  ...details, collegeId: 'sanjivani', startAt: inDays(-1, 8), endAt: inDays(7, 23),
  questionCount: 20, attemptLimit: 2, questions: makeQuestionPool(details.topics[0], 14), participants: 0, completed: 0, status: 'Active',
}));

export const quizzes: Quiz[] = [
  { id: 'q-circuits', title: 'Circuit Theory: Quick Practice', description: 'Build confidence with core circuit analysis concepts.', subject: 'Electrical Engineering', topics: ['Circuit Theory', 'Network Theorems'], collegeId: 'sanjivani', department: 'Electrical Engineering', className: 'Second Year', section: 'A', startAt: inDays(-1, 8), endAt: inDays(2, 23), questionCount: 20, attemptLimit: 2, questions: makeQuestionPool('Circuit Theory', 14), participants: 84, completed: 62, status: 'Active' },
  { id: 'q-data', title: 'Data Structures Foundations', description: 'Practice your understanding of linear data structures.', subject: 'Computer Engineering', topics: ['Arrays', 'Linked Lists'], collegeId: 'sanjivani', department: 'Computer Engineering', className: 'Second Year', section: 'B', startAt: inDays(1, 9), endAt: inDays(4, 18), questionCount: 20, attemptLimit: 1, questions: makeQuestionPool('Data Structures', 14), participants: 0, completed: 0, status: 'Upcoming' },
  { id: 'q-math', title: 'Engineering Mathematics II', description: 'A focused practice set on differential equations.', subject: 'Engineering Mathematics', topics: ['Differential Equations', 'Laplace Transform'], collegeId: 'sanjivani', department: 'Applied Sciences', className: 'First Year', section: 'C', startAt: inDays(-8, 9), endAt: inDays(-2, 18), questionCount: 20, attemptLimit: 3, questions: makeQuestionPool('Differential Equations', 14), participants: 126, completed: 117, status: 'Expired' },
  ...showcaseQuizzes,
  { id: 'q-os', title: 'Operating Systems: Processes', description: 'Review process scheduling and synchronization.', subject: 'Computer Engineering', topics: ['Processes', 'Scheduling'], collegeId: 'other-college', startAt: inDays(-1, 8), endAt: inDays(2, 23), questionCount: 20, attemptLimit: 1, questions: makeQuestionPool('Processes', 14), participants: 30, completed: 20, status: 'Active' },
];

export const leaderboardEntries: LeaderboardEntry[] = [
  ['s1', 'Aarav Kulkarni', 19, 842], ['s2', 'Ananya Patil', 18, 790], ['s3', 'Rohan Shinde', 18, 806], ['s4', 'Isha Deshmukh', 17, 725], ['s5', 'Vivek Pawar', 16, 660], ['s6', 'Sana Shaikh', 15, 703], ['s7', 'Om Jadhav', 15, 730], ['s8', 'Mira Joshi', 14, 682], ['s9', 'Atharv More', 14, 740], ['s10', 'Neha Bhosale', 13, 611], ['s11', 'You', 12, 605], ['s12', 'Kavya Patil', 10, 690],
].map(([studentId, name, score, durationSeconds]) => ({ studentId: String(studentId), name: String(name), score: Number(score), durationSeconds: Number(durationSeconds) }));

export const currentStudent = { id: 's11', name: 'Aarav', collegeId: 'sanjivani', department: 'Electrical Engineering', className: 'Second Year', section: 'A' };
