# Prototype Features and Limitations

## Included

- Student and Teacher dashboard preview with a role switcher.
- College-scoped mock quiz listing with search, status, and topic filters.
- Quiz instructions and one-question-at-a-time practice flow.
- Mock autosave, pause/resume, deadline submission while the attempt screen is open, and attempt limits in browser storage.
- Answer review, score, accuracy, unanswered count, topic/difficulty summaries.
- Per-quiz mock leaderboard with competition ranks and top-10 visibility.
- Teacher quiz overview, management list, and quiz creation form.
- Difficulty question pools with a minimum of 70% of the attempt length for each level; each student receives a randomized attempt starting at Easy and continuing at their adaptive level.
- Reusable adaptive, scoring, status, and leaderboard functions.

## Limitations

- Role switching is not authentication. All authorization and college scoping are mock frontend behavior and can be bypassed.
- Mock datasets are static and not shared between users or devices.
- Browser storage may be cleared or edited and must never be treated as authoritative.
- Newly created quizzes default to a one-week schedule, but start and end times can be adjusted in the create form.
- Teachers author MCQs while creating a quiz. A reusable question bank and review workflow are not included yet.
- Pool exhaustion currently falls back to any remaining difficulty at random; the production behavior still needs a product decision.
- The adaptive rules run in the browser for demonstration only; production scoring and difficulty selection must be server-side.
- The parser, email invitations, analytics dashboards, administration screens, and production backend are not implemented.
- Real accessibility testing, browser compatibility checks, and production security review remain necessary.
