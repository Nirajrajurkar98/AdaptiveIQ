# AdaptiveIQ

AdaptiveIQ is a practice quiz and classroom platform. The initial MVP has three roles: PLATFORM_ADMIN, TEACHER, and STUDENT. College management and academic hierarchy are out of scope for this MVP. The React + TypeScript frontend in `apps/web` remains a mock-driven prototype; the separate NestJS API in `apps/api` uses PostgreSQL and Prisma and currently provides foundation/health endpoints only. No authentication or product API is implemented yet.

## Requirements

- Windows 11 with PowerShell
- Node.js 22.12 or newer
- npm 10 or newer
- Docker Desktop with Docker Compose

## First-time setup

Run from the repository folder. Set a local development password in `.env`; the example value is only a placeholder.

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
docker compose up -d postgres
npm run db:generate
npm run db:deploy
npm run db:seed
```

The current checked-in migration is the original multi-college foundation. The MVP documentation proposes a simpler future schema, but no migration has been approved or applied. Preserve database data and migration history; do not delete the local volume to adopt the new direction.

## Authentication setup

After applying the additive authentication migration, set a one-time `ADMIN_BOOTSTRAP_SECRET` in the local `.env` to a randomly generated value with at least 32 characters. Do not commit it or share it in chat. Start the API and web app, open the AdaptiveIQ sign-in page, choose **First administrator setup**, and submit the secret with the administrator's name, email, and a password of at least 12 characters. Bootstrap succeeds only once; remove `ADMIN_BOOTSTRAP_SECRET` from `.env` after setup. Student registration is public and always creates a STUDENT account. Teacher accounts must be activated from a single-use administrator invitation. Without an email provider, the admin screen clearly reports that email was not sent and displays a private link to copy to the intended teacher.

Auth sessions are stored server-side; only a SHA-256 digest of the opaque session token is stored in PostgreSQL. The browser receives the token in an HTTP-only, SameSite=Lax cookie. Production requires HTTPS (`Secure` is always enabled in production). Set `WEB_ORIGIN` and `PUBLIC_APP_URL` to the production web origin before deployment.

For production, serve the web app and API on the same site and route `/api` to NestJS through a reverse proxy; the browser client uses same-origin `/api/v1` requests. Keep bootstrap and database secrets in the deployment's secret store, and use HTTPS end to end.

## Start the applications

In separate PowerShell windows:

```powershell
npm run dev
```

```powershell
npm run dev:api
```

The web prototype is normally at `http://localhost:5173`; the API is at `http://localhost:3000/api/v1`. Check `GET /api/v1/health` and `GET /api/v1/health/database` for service and database health.

To stop PostgreSQL without deleting its data, run `docker compose stop postgres`. Avoid `docker compose down -v`, which deletes the local database volume.

## Checks

With PostgreSQL running and migrations applied:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

See [docs/PRD.md](docs/PRD.md) for MVP requirements, roles, confirmed adaptive behavior, unresolved choices, and roadmap; [docs/FEATURES.md](docs/FEATURES.md) for current reuse and gaps; [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for target architecture and migration implications; and [docs/TESTING.md](docs/TESTING.md) for current checks.

## Repository layout

- `apps/web/` — preserved React + TypeScript prototype using mock data.
- `apps/api/src/` — NestJS API foundation.
- `apps/api/prisma/` — PostgreSQL schema, existing migrations, and demo seed.
- `docs/` — product, architecture, schema, feature, and testing documentation.
