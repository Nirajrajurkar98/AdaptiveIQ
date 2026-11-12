# AdaptiveIQ Contributor Instructions

- The initial MVP is a practice quiz and classroom platform with PLATFORM_ADMIN, TEACHER, and STUDENT roles. College management, departments, academic years, and college memberships are out of scope for this MVP; see `docs/PRD.md`.
- Work one approved milestone at a time. Inspect existing files before changing them; do not overwrite work blindly.
- Keep strict TypeScript enabled. Keep the React frontend and NestJS API responsibilities separate.
- Keep reusable product rules out of UI components. Validate API inputs and enforce all permissions on the server.
- Never treat role selectors, browser storage, mock data, user IDs, or classroom IDs supplied by a client as authentication or authorization. Use verified identity and server-derived permissions.
- Teachers can manage their own quizzes and classrooms; students' classroom member-list access is membership-limited. Students cannot view other students' detailed answers. Enforce these rules in the API.
- Never commit secrets. Validate environment configuration and avoid logging secrets or unnecessary student information.
- Do not invent product rules. Record unresolved choices in docs and ask before implementing behavior that depends on them.
- Add or update automated tests for each implemented feature, especially adaptive rules, attempt limits, result calculations, leaderboard visibility/privacy, classroom membership, and teacher ownership.
- Use accessible labels, keyboard-operable controls, responsive layouts, and consistent naming.
- Document meaningful architecture decisions in `docs/` and update feature/testing documentation when behavior changes.
- Keep the existing React mock behavior intact until a later approved milestone explicitly replaces or connects it.
- The existing NestJS API uses PostgreSQL and Prisma. Do not remove college schema/data or rewrite existing migrations without an approved, non-destructive migration plan. Use `npm run db:migrate` during development and `npm run db:deploy` for an existing migration set after migration review.
- Keep `.env` local; only `.env.example` belongs in version control. Seeded users are demo data, never authentication.
