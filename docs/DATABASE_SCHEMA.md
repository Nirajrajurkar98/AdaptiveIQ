# Database Schema: Current State and MVP Proposal

## Current state

PostgreSQL and Prisma are established in `apps/api`. The checked-in Prisma schema and initial migration implement the earlier multi-college foundation: `User`, `College`, `CollegeMembership`, `Department`, `AcademicYear`, `Class`, `Section`, `Subject`, `TeacherProfile`, `StudentProfile`, `TeacherAssignment`, and `StudentEnrollment`. Composite foreign keys enforce consistent college and academic scope. The seed contains demo data. There are no authentication credentials, quizzes, questions, attempts, results, or leaderboard tables. Do not treat seed roles as authentication.

## Proposed MVP entities

| Entity | Purpose and key relationships |
| --- | --- |
| User | Login identity, active/inactive status, timestamps. |
| TeacherProfile / StudentProfile | Optional role-specific details linked one-to-one to User. Platform admin role/permission also needs a server-controlled representation. |
| TeacherInvite | Invitation status and activation data for admin-created teacher accounts; delivery, expiration, and revocation rules need decisions. |
| Classroom | Owned by a teacher; name, description, unique invitation code, timestamps. |
| ClassroomMembership | Student membership and join timestamp; unique `(classroomId, studentId)`. |
| Question | Teacher author, prompt, four options, one correct option, explanation, difficulty, topic, status. Enforce option/correct-answer constraints in validated domain logic and suitable database constraints. |
| Quiz | Teacher owner, name/description, practice or examination mode, question count, schedule, limited attempts, publication state. |
| QuizQuestion / question pool | Quiz-to-question association and difficulty pool; exact reuse and selection policy still needs product decisions. |
| ClassroomQuiz | Classroom-to-shared-quiz association. |
| Attempt | Student and quiz references, state, start/submission times, saved progress for pause/resume. |
| AttemptAnswer | Attempt/question reference, selected option, answer timestamp. Access must be private to that student and the owning teacher. |
| Result | Either derived from submitted attempts or persisted as a consistent snapshot; choose one authoritative representation during detailed design. |
| ActivityEvent | Possible source for platform-wide activity; event scope and retention are undecided. |

This proposal is not a Prisma schema and does not settle IDs, exact enums, deletion policies, indexes, snapshot shape, or retention.

## Migration implications and safe sequence

The existing initial migration is part of the database history. Do not rewrite it or remove existing tables/data as part of adopting this proposal. A future migration plan should:

1. Inventory local and any deployed database data and identify existing migration environments.
2. Decide how current users, college memberships, profiles, and demo seed records map to platform admin, teacher, or student. The new product scope removes colleges, but no rule has been approved for preserving or discarding historical college assignments.
3. Define a reviewed, forward-only migration and any data backup/restore plan. Keep `.env` local and never include credentials in documentation or version control.
4. Apply with the repository's documented `npm run db:migrate` development workflow or `npm run db:deploy` for an existing migration set only after the migration plan is approved.
5. Remove old models only in a separately reviewed migration after confirming data handling. Do not use volume deletion or destructive reset commands.

This milestone changes documentation only; the Prisma schema, SQL migrations, database, and seed are unchanged.
