# Testing Strategy

## Run checks (Windows PowerShell)

Run these commands from the repository root. PostgreSQL must be running and migrated for the database integration tests:

```powershell
docker compose up -d postgres
npm test
npm run typecheck
npm run lint
npm run build
```

The web workspace's Vitest tests continue to cover the preserved prototype's adaptive rules, scoring, scheduling, leaderboard projection, and student/teacher screens. API Jest tests cover:

- Student registration, duplicate email handling, Argon2 password hashes, role assignment, successful/failed login, logout revocation, session expiry, account deactivation, and teacher invitation expiry/reuse.
- Session-protected routes, role-protected admin routes, rejection of client-supplied role properties, cookie flags/clearing, cross-origin write rejection, bootstrap protection, and invitation revocation.

- `GET /api/v1/health` and the database health endpoint, including success and a consistent HTTP 503 response.
- A real PostgreSQL connection as exercised by the database health request in the running app.
- Repeatable development seeding and expected demo record relationships.
- A PostgreSQL foreign-key rejection when an academic year uses a department from a different college.

Prisma schema validation and migration generation check that declared relationships and constraints are accepted by Prisma/PostgreSQL. `npm run typecheck` checks both strict TypeScript workspaces, and `npm run build` builds both applications.

## Production test plan

Before any identity, assessment, or tenant-facing API work ships, add tests for authentication and authorization, concurrent writes, every cross-tenant query, migrations from supported prior versions, enrollment transfers, assessment attempt limits, result calculations, and leaderboard visibility. Tests of browser mock behavior do not prove server security or production correctness.
