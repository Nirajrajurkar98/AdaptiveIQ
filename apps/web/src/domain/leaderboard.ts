import type { LeaderboardEntry } from './types';

export interface RankedEntry extends LeaderboardEntry { rank: number; }
/** Competition ranking: equal score and duration share rank and skip the next rank. */
export function rankEntries(entries: LeaderboardEntry[]): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score || a.durationSeconds - b.durationSeconds);
  let previous: LeaderboardEntry | undefined;
  let rank = 0;
  return sorted.map((entry, index) => {
    if (!previous || entry.score !== previous.score || entry.durationSeconds !== previous.durationSeconds) rank = index + 1;
    previous = entry;
    return { ...entry, rank };
  });
}

/** Exposes the top ten and the current student's own result only. */
export function visibleLeaderboard(entries: LeaderboardEntry[], currentStudentId: string) {
  const ranked = rankEntries(entries);
  return { totalAttempts: entries.length, topTen: ranked.slice(0, 10), ownEntry: ranked.find((entry) => entry.studentId === currentStudentId) };
}
