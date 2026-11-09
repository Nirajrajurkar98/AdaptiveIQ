# AdaptiveIQ Architecture

## Current prototype

The repository is an npm-workspaces monorepo with a React + TypeScript + Vite web application in `apps/web`. Tailwind CSS provides styling. Domain rules are kept in `src/domain/`, mock fixtures in `src/data/`, and page composition in `src/App.tsx`.

There is no real API or database in this phase. `localStorage` holds resumable student attempts and attempt counts. This is deliberately a browser-only demo mechanism, not a security boundary.

## Intended production direction

Use a modular monolith: a React web app and a NestJS REST API with separately organized modules, PostgreSQL, and Prisma. Keep API and UI responsibilities separate. Add a worker process only when tasks such as email delivery or parsing need asynchronous processing. Avoid microservices until measured operational needs justify them.

Potential future npm workspace layout:

```text
apps/
  web/                       React + TypeScript + Tailwind
  api/                       NestJS REST API
  worker/                    Background jobs when needed
packages/
  api-client/                Generated client from OpenAPI
  config/                    Shared tooling configuration
prisma/                      Approved schema and migrations
docs/                        Product and architecture decisions
```

## Frontend responsibilities

The browser presents role-specific workflows, collects input, and displays server results. It should not be trusted to enforce permissions, score an official assessment, choose protected questions, or isolate colleges. Domain functions currently provide prototype behavior and can be reused or reimplemented with server-side tests when the API is added.

## Future API organization

Candidate modules: Auth, Users, Colleges, AcademicStructure, Memberships, Teachers, Students, Invitations, QuestionBank, QuestionParser, Assessments, AdaptiveEngine, Scoring, Leaderboards, Analytics, Notifications, and Audit. Keep business rules in use cases/domain services, persistence in Prisma-backed adapters, and validate requests at the API boundary.

## Tenant safety

Every tenant-owned record should have a verified college scope. Derive the active college from authenticated identity and membership; a client-provided college ID is not authorization. Scope queries, uniqueness constraints, object storage, caches, jobs, and audit events. Consider PostgreSQL row-level security only after the initial tenant model and connection behavior are well understood.

## Decisions still needed

Authentication provider and session model; role permissions; multi-college membership behavior; academic structure lifecycle; attempt policies; assessment timing and scheduling semantics; scoring rules; and privacy/retention requirements. See [PRD.md](PRD.md).
