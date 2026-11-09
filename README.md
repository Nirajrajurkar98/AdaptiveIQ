# AdaptiveIQ

AdaptiveIQ is a multi-college adaptive assessment platform. This repository currently contains a frontend-first React prototype for student and teacher workflows. It uses realistic in-memory mock data and browser storage for a resumable quiz attempt; it has no production backend, database, identity system, or email delivery.

## Requirements

- Windows 11
- Node.js 22 or newer
- npm 10 or newer

## Run locally

Open PowerShell in this project folder and run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Use **Preview as** in the top bar to switch between Student and Teacher dashboards. Start a student quiz from Practice quizzes; create a teacher quiz from Create quiz. Quiz attempts are saved in that browser's local storage for this prototype.

## Checks

```powershell
npm test
npm run typecheck
npm run build
```

## Repository layout

- `apps/web/src/domain/` contains independent adaptive, scoring, scheduling, and ranking rules.
- `apps/web/src/data/` contains prototype data, separate from UI components.
- `apps/web/src/` contains React screens and reusable interface components.
- `docs/` contains product, architecture, feature, and testing notes.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/FEATURES.md](docs/FEATURES.md) for details and prototype limitations.
