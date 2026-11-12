# AdaptiveIQ Architecture

## Current implementation

This npm-workspaces repository contains a React + TypeScript + Tailwind-oriented frontend in `apps/web` and a separate NestJS REST service in `apps/api`. The existing quiz experience remains a mock prototype with browser storage and a clearly labeled role preview. The authenticated account area is separate and uses the API for registration, login, current user, logout, platform-admin teacher invitations, and teacher account activation/deactivation. The Prisma schema retains the earlier college hierarchy alongside the new account/session/invitation models. Auth sessions store token hashes and have a seven-day fixed expiry; teacher invites are single-use and expire after seven days. The initial admin is created through the secret-protected, single-use bootstrap endpoint.

## Target MVP boundaries

The target stack is React + TypeScript + Tailwind CSS, NestJS, PostgreSQL, and Prisma, with Recharts where analytics are needed. Keep React responsible for presentation and user interactions. NestJS owns validation, authentication, authorization, business rules, attempt state, scoring, and data access. PostgreSQL with Prisma stores durable data. Never trust role selectors, browser storage, mock data, client-supplied user IDs, or classroom IDs as proof of identity or permission. Derive the acting user and role from a verified identity; check teacher ownership and classroom membership on the server. Cookie-backed state changes must come from the configured web origin.

Suggested NestJS modules: Authentication, Users, Teachers, Students, Classrooms, Questions, Quizzes, Attempts, Results, and Leaderboards. Platform administration should be a server-enforced permission, not a client-selected role. Analytics/activity may be delivered through admin endpoints when defined.

## Simplified entity proposal

- `User`: identity, unique login identifier, status, and timestamps.
- `TeacherProfile` / `StudentProfile`: role-specific profile data if needed; keep role assignment server-controlled.
- `TeacherInvite`: invitation lifecycle and activation metadata; exact delivery and expiration rules remain undecided.
- `Classroom`: name, description, owner teacher, unique invitation code/link, timestamps.
- `ClassroomMembership`: student-to-classroom membership and join time; unique per student/classroom.
- `Question`: author, prompt, four options, exactly one correct option, explanation, topic, difficulty, status.
- `Quiz`: owner teacher, title/description, mode (practice/adaptive or examination/fixed), configured question count, schedule, attempt limit, publication state.
- `QuizQuestion` or question-pool relation: links questions to a quiz and stores pool membership where needed; selection and reuse rules need product decisions.
- `ClassroomQuiz`: classroom-to-shared-quiz relation.
- `Attempt`: student, quiz, lifecycle state, start/submission timestamps, and saved progress needed for resume.
- `AttemptAnswer`: attempt/question, selected option, answer timestamps; never expose another student's rows through student endpoints.
- `Result` may be stored or derived from a submitted attempt, but one authoritative source should be chosen during detailed design.
- Activity records for platform-wide activity require an event scope and retention decision.

This is a conceptual proposal, not an approved Prisma schema. IDs, deletion/retention rules, invite security, question reuse, attempt snapshots, and event retention need detailed design before migration.

## Existing database and migration implications

The current Prisma schema has `User`, `College`, `CollegeMembership`, `Department`, `AcademicYear`, `Class`, `Section`, `Subject`, teacher/student profiles, assignments, and enrollments. Its initial SQL migration is already checked in, and the seed supplies demo college structure and memberships. Removing college complexity therefore requires a planned transition, not simply editing the Prisma schema: old memberships and academic rows may contain data, and deleting models can generate destructive SQL. Preserve existing migrations and data. Before any database change, inspect local/deployed data, decide how users and roles map to the three MVP roles, define handling for college-owned quiz mock data (if any) and demo memberships, author a reviewed forward migration, and back up applicable databases. Do not reset volumes or run destructive migrations. The current API has no quiz data tables, so the proposal adds domain entities later rather than translating existing quiz records.

## Security and tenant boundary

The MVP has no college tenant scope. Ownership boundaries are teacher-owned quizzes and teacher-owned classrooms, plus classroom membership for member-list access. All checks belong in NestJS using verified identity and database relationships. An invitation code grants a join flow only after the student authenticates; it is not a substitute for authentication. Seeded users remain demo data, never credentials.

## Decisions awaiting review

See unresolved behavior in [PRD.md](PRD.md). In particular, scoring, attempt-count semantics, leaderboard attempt selection, invite lifecycle, question reuse/pool exhaustion, and deadline handling must be decided before the relevant service or schema behavior is implemented.
