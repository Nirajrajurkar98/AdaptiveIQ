# AdaptiveIQ Contributor Instructions

- This is a long-term multi-college assessment platform. Keep changes incremental and explain decisions in plain language for a beginner developer.
- Work one approved milestone at a time. Inspect existing files before changing them; do not overwrite work blindly.
- Keep strict TypeScript enabled. Keep frontend and future NestJS API responsibilities separate.
- Keep reusable product rules out of UI components. Validate API inputs and enforce all permissions on the server when a backend exists.
- Never treat role selectors, browser storage, mock data, or client college IDs as authentication or authorization.
- Never commit secrets. Validate environment configuration and avoid logging secrets or unnecessary student information.
- Do not invent product rules. Record unresolved choices in docs and ask before implementing behavior that depends on them.
- Add or update automated tests for each implemented feature, especially adaptive rules, attempt limits, result calculations, leaderboard visibility, and tenant isolation.
- Use accessible labels, keyboard-operable controls, responsive layouts, and consistent naming.
- Document meaningful architecture decisions in `docs/` and update feature/testing documentation when behavior changes.
