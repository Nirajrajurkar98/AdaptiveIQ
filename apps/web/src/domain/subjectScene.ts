export type SubjectSceneKind =
  | 'electric'
  | 'computing'
  | 'data'
  | 'ai'
  | 'cyber'
  | 'electronics'
  | 'civil'
  | 'mechanical'
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'general';

function detectSceneKind(text: string): SubjectSceneKind | undefined {
  if (/electronics|communication engineering/.test(text)) return 'electronics';
  if (/^physics\b/.test(text)) return 'physics';
  if (/electrical|circuit|electricity|power system|network theorem/.test(text)) return 'electric';
  if (/data structure|algorithm|linked list|\barrays?\b|\btrees?\b/.test(text)) return 'data';
  if (/artificial intelligence|machine learning|neural network|\bai\b/.test(text)) return 'ai';
  if (/cyber.?security|information security|encryption/.test(text)) return 'cyber';
  if (/civil engineering|structural|construction/.test(text)) return 'civil';
  if (/mechanical|manufacturing|machine|mechanics/.test(text)) return 'mechanical';
  if (/math|calculus|algebra|combinatorics|\blogic\b|set theory/.test(text)) return 'math';
  if (/physics|electromagnetism|optics|thermodynamics/.test(text)) return 'physics';
  if (/chemistry|chemical|materials|chemical bonds/.test(text)) return 'chemistry';
  if (/computer|\bit\b|software|program|information technology|operating system/.test(text)) return 'computing';
  return undefined;
}

/** Prefer an explicit quiz-title match, then fall back to subject and topics. */
export function resolveSubjectSceneKind({ title, subject, topics }: { title: string; subject: string; topics: string[] }): SubjectSceneKind {
  const titleMatch = detectSceneKind(title.toLowerCase());
  if (titleMatch) return titleMatch;
  const contextMatch = detectSceneKind(`${subject} ${topics.join(' ')}`.toLowerCase());
  return contextMatch ?? 'general';
}
