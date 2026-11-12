# Features, Reuse, and Gaps

This file describes the present prototype against the simplified MVP. The browser implementation is a demo, not production authorization or persistence.

## Milestone 2: authentication foundation

- Student registration always assigns STUDENT; login, logout, and current-user lookup use server-managed sessions and HTTP-only cookies.
- Passwords use Argon2id; database sessions contain only a SHA-256 token digest, with a seven-day expiry and revocation on logout or teacher deactivation.
- State-changing browser requests are checked against the configured web origin; cross-origin browser writes are rejected.
- A secret-protected one-time bootstrap creates the first platform admin. Only admins can invite teachers and activate/deactivate teacher accounts.
- Teacher invitations are single-use, stored as token digests, expire after seven days, and are explicitly marked as not emailed until a provider is configured.
- The existing quiz UI remains available only as a separate, clearly labeled prototype preview. The account area uses API identity/role and does not treat the preview selector as authorization.

## Existing features to reuse

- React + TypeScript quiz browsing, instructions, one-question flow, results, teacher quiz list, and quiz creation UI.
- Question draft form with four-option MCQs and explanations.
- Adaptive state transition helper and difficulty question-pool selection helper.
- Result summaries by score, accuracy, topic, and difficulty.
- Competition ranking helper, quiz status helper, and start/resume eligibility helper.
- Mock pause/resume, browser autosave, attempt counters, and deadline submission flow as interaction prototypes only.
- Responsive layout, accessible labels in existing controls, reduced-motion support, and subject-specific visual scenes. Preserve and improve components where they fit the product design direction.
- NestJS API foundation, global DTO validation setup, exception formatting, health routes, Prisma service, and PostgreSQL configuration.

## Existing features requiring modification

- Remove college, department, class, section, and academic-scope filtering from the MVP experience. Current mock quiz visibility is scoped to a college and student academic fields.
- Replace the college workspace switcher and assumptions in frontend types/mock data with teacher-owned quizzes and classrooms. Keep prototype behavior until a later approved implementation milestone.
- Change leaderboard presentation from top 10 to top 20, include total participants, and expose a student's own rank/score outside the top 20. Existing helper returns top ten and total attempts.
- Review visibility and privacy: students must not receive other students' answer/explanation detail; teachers can see detailed results only for their own quizzes.
- Update quiz authoring and domain rules to encode exact four options, one correct option, at least 20 questions, teacher-configured question count and pools, quiz mode, and schedule/attempt settings. The prototype includes several related flows, but production validation must be server-side.
- Keep explanations and correctness hidden during attempts and reveal detailed feedback only after submission.
- Preserve the precise adaptive rules in [PRD.md](PRD.md); remove any in-attempt correctness or difficulty-change feedback if present.
- Add authenticated registration/login, platform admin tools, account activation, classrooms, invitation links, membership views, shared quiz links, and server authorization. These are not implemented.
- Connect the frontend to API only in a later approved milestone. No API authentication, user, classroom, question, quiz, attempt, result, or leaderboard modules currently exist.

## Not included in this documentation milestone

No code, Prisma schema, SQL migration, seed, mock data, or frontend behavior was changed. The migration implications and proposed target entities are documented in [ARCHITECTURE.md](ARCHITECTURE.md) and [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). Add automated tests alongside each implementation feature, especially adaptive rules, attempt limits, results, leaderboard visibility/privacy, classroom membership, and teacher ownership.
