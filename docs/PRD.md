# AdaptiveIQ MVP Product Requirements

## Product direction

AdaptiveIQ is a practice quiz and classroom platform. The initial MVP supports one platform administrator, teachers, and students. College management and college, department, academic year, class, section, and college membership concepts are out of scope. This direction supersedes earlier multi-college plans; it does not authorize deleting existing data or changing the database.

## Roles and permissions

| Role | MVP permissions |
| --- | --- |
| PLATFORM_ADMIN | Log in; create, invite, activate, and deactivate teacher accounts; view registered users, all quizzes and classrooms, and platform-wide activity. |
| TEACHER | Log in; create and manage own practice quizzes and classrooms; write MCQs; generate classroom invitation links; share quiz links; see members of owned classrooms; see participation and detailed results for own quizzes; see the top 20 leaderboard. Teachers cannot create teacher accounts. |
| STUDENT | Register and log in; browse published practice quizzes and open shared links; join classrooms by invitation; see members and shared quizzes in joined classrooms; attempt available quizzes; see own detailed results and quiz leaderboards. |

Students must authenticate before attempting. Any authenticated student may attempt any published practice quiz; classroom membership is optional and organizes students. Only classroom members can see that classroom's member list. Other students' detailed answers and explanations stay private. Students outside the top 20 see their own rank and score. Show total participants.

## Quiz rules

- Version 1 supports MCQs with exactly four options, exactly one correct option, and an explanation. Difficulty is Easy, Medium, or Hard.
- Each quiz has at least 20 questions. The teacher configures question count and question pools.
- The teacher sets start and end date/time and a limited attempt count.
- Save student answers automatically. Students may pause and resume before the deadline. Submit automatically at the deadline.
- Practice Mode adapts according to the exact rules below. Examination Mode stays at a fixed difficulty.
- Do not reveal correctness or difficulty changes during an attempt. Show detailed feedback only after submission.

### Adaptive Practice Mode

Start at Easy. Three consecutive correct answers increase difficulty by one level. Two consecutive incorrect answers decrease it by one level. A single incorrect answer does not change difficulty. Correct answers reset the incorrect streak; incorrect answers reset the correct streak. Clamp difficulty between Easy and Hard.

### Results and rankings

Rank by higher score, then faster completion time. Equal score and time share ranks, using competition ranking (1, 2, 3, 3, 5). Students see the top 20 and their own rank/score if outside it. Teachers see detailed results for their own quizzes. The existing prototype uses one point per correct answer; confirm whether that scoring is retained before production implementation. The product direction does not define whether leaderboard rows represent best attempt or latest attempt, or exactly how a limited attempt is consumed; resolve these choices before implementing those behaviors.

## Product decisions to resolve before dependent implementation

- Whether the existing one-point-per-correct scoring is approved for production.
- Whether each leaderboard participant is represented by their best or latest attempt.
- When an attempt is counted against the configured limit (start or submit), and how abandoned attempts count.
- Classroom quiz sharing semantics (link visibility versus membership-only visibility) beyond the stated member list privacy.
- Invitation expiration, revocation, and code rotation behavior.
- Teacher invitation delivery and student registration identity verification.
- Quiz publication/editing behavior after attempts begin, and exact deadline/time-zone handling.
- Whether questions can be reused across quizzes; a reusable question bank is not specified.
- Pool exhaustion and question selection behavior. Do not carry forward the prototype fallback as a product rule without approval.

## Design direction

Use a restrained, distinctive education product identity, strong typography, consistent spacing, practical forms and tables, useful hierarchy, limited decoration, accessible contrast, and responsive teacher/student experiences. Preserve sound existing components and improve only where needed.

## Roadmap

1. Review this product direction, role boundaries, schema proposal, and migration implications. Resolve the listed choices that affect behavior.
2. Plan a non-destructive transition from the current college schema and demo seed. Keep the current schema/migrations until an approved migration plan exists.
3. Establish authentication and server-derived role/ownership checks; build account administration and teacher/student registration flows.
4. Build question and quiz authoring, publication, schedule, attempt, adaptive practice, autosave/resume, and deadline submission with focused automated tests.
5. Build classrooms, invitations, membership-only lists, and quiz sharing.
6. Build private results and top-20 leaderboards, then activity and analytics.
7. Connect the React prototype incrementally, preserving useful components; verify responsive and accessible flows.

No implementation milestone is approved by this document update.
