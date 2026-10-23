# Changelog

## 2.8.0 — 2026-10-23

- **Removed** the @pedramknight2 YouTube monitor (10-minute video check, glass
  banner, settings card, background alarm/notifications, storage keys, embedded
  API-key placeholder). Migration clears all legacy data.
- **Security:** the embedded Gemini API key was removed from the client; each
  install sets its own key in Settings. (Rotate/revoke any key that ever lived
  in code.)
- **Repo professionalized for AI-assisted engineering** per *Beyond Vibe Coding*
  (Addy Osmani): `SPEC.md` (mini-PRD + hard constraints), `AGENTS.md` (agent
  rules), `docs/` (architecture, testing, security, review checklist, release),
  tests moved into `tests/` with one-command runner, GitHub issue/PR templates
  and CI workflow.

## 2.7.0 — 2026-10-23

- **Day image export** («عکس روز») in the planning card: PNG of the viewed day's
  scheduling clock with a leader line out of every band and the task name, time
  range and duration written outside the dial. Plan/habit bands are tagged
  («برنامه»/«عادت»/«روتین»); done-as-planned labels are deduplicated.

## 2.6.0 — 2026-09-18

- **Sleep as a normal habit** (`builtin_sleep`, `#5b6bb0`) with bed/wake pickers;
  separate sleep card removed.
- Timer-only activities, full-day timeline, **automatic end-of-day AI review**
  with relative scoring (100 impossible, 90+ exceptional).
- **Removed** token economy and Anna/persona mode completely (per product
  decision "ineffective in tests").
- Fixed AI chat breakage (`chatId`/`replyDraft`) and the extra empty reply box
  (`.rb-bar[hidden]`).
