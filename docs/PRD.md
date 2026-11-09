# AdaptiveIQ Product Requirements (Prototype)

## Product

AdaptiveIQ supports multiple colleges managing academic structure, teachers, students, question banks, adaptive practice assessments, results, leaderboards, and analytics. Sanjivani College of Engineering is the initial target institution.

## Prototype users

- Platform Admin: platform-wide college management (not implemented in the UI prototype).
- College Admin: college-wide management (not implemented in the UI prototype).
- Teacher: create and manage practice quizzes.
- Student: discover assigned practice quizzes, complete or resume an attempt, review results, and see a quiz leaderboard.

The demo role selector previews Student and Teacher experiences. It is not authentication and does not provide real access control.

## Prototype requirements

- College hierarchy: College → Department → Academic Year → Class → Section.
- Users may have different roles in multiple colleges; this is represented in the future architecture, not enforced by a server in this UI-only prototype.
- Practice quizzes use Easy, Medium, and Hard question pools and deliver the configured number of questions per student (at least 20 in this prototype).
- Each difficulty pool must contain at least 70% of the configured attempt length, rounded up to a whole question. For a 20-question attempt, teachers provide at least 14 Easy, 14 Medium, and 14 Hard questions (42 questions in the pool).
- Questions are selected randomly without repeating a question within one attempt. An attempt begins at Easy and selects from the current adaptive difficulty when questions are available.
- Students can see only mock quizzes for their selected college and matching their mock academic scope.
- Answers and explanations are revealed only on the results screen.
- Attempts may be paused and resumed in the same browser. The scheduled deadline triggers submission while the attempt screen is open.
- Leaderboards rank by score, then completion duration, with competition ranking for ties.

## Confirmed practice adaptive rules

- Start at Easy.
- Three consecutive correct answers move up one difficulty level.
- Two consecutive incorrect answers move down one level.
- A correct answer resets the incorrect streak; an incorrect answer resets the correct streak.
- Difficulty is clamped from Easy through Hard.

The prototype selects an unused question randomly at the resulting difficulty when one is available; if that level's pool has no unused questions, it randomly selects from any remaining difficulty. This pool-exhaustion fallback is a prototype choice and should be reviewed before production behavior is finalized.

## Prototype scoring choice

The prototype uses one point per correct answer, no partial credit, and no penalty for incorrect or unanswered items. This is a simple placeholder because the production scoring formula has not been decided.

## Prototype constraints

Data is local mock data. Role switching is for preview only. Browser storage is not a secure persistence mechanism. Email invitations, backend APIs, server-side authorization, cross-device resume, analytics, and production question parsing are not included. See [FEATURES.md](FEATURES.md).
