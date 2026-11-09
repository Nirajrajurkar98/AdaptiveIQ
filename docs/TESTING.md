# Testing Strategy

## Current automated checks

Vitest and Testing Library cover:

- Correct and incorrect streak transitions, opposite-answer resets, and Easy/Hard boundaries.
- Required per-difficulty pool sizes, question pool validation, random selection at the target level, no repeated selections, and pool-exhaustion fallback.
- Unanswered result calculation and quiz schedule/attempt eligibility rules.
- Leaderboard score/time sorting, competition ties, top-ten privacy projection, and college-scoped mock data.
- Student quiz screen answer/explanation privacy, pause/resume persistence, college quiz visibility, and leaderboard visibility.

Run from PowerShell at the repository root:

```powershell
npm test
npm run typecheck
npm run build
```

## Production test plan

When an API and database are added, add API integration tests for authorization and tenant isolation, database tests for constraints and migrations, and end-to-end tests for invitations, assessment attempts, automatic submission, results, and leaderboards. Include tests for concurrent answer submissions and a student attempting to access another college's quiz or result.

Tests of browser mock behavior do not prove server security or production correctness.
