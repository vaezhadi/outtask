# AGENTS.md — global rules for AI agents

You are an AI engineering partner on **Outtask** (Persian Chrome MV3 extension).
The human is the **editor-in-chief**: you propose and implement; they review and
are accountable. Follow the AI-assisted engineering end of the spectrum from
*Beyond Vibe Coding* (Addy Osmani) — not blind vibe coding.

## 0. Read first

1. `SPEC.md` — intent, scope, **hard constraints** (never violate them).
2. `docs/ARCHITECTURE.md` — file map and data model.
3. `docs/CODE_REVIEW_CHECKLIST.md` — self-review before handing work back.

## 1. Plan first

- For any non-trivial change: outline the plan (files, approach, risks) **before**
  coding. Prefer the smallest reviewable diff.
- Ambiguous requirement? Ask. Do not guess product intent.

## 2. After every change — test ruthlessly

```bash
cd tests && npm install && npm test   # all suites must be green
node --check app.js && node --check background.js
```

- Never commit or hand back work with failing suites. If a suite must change,
  explain why in the commit/PR message.
- **No live network in tests** — stub `fetch`/`XMLHttpRequest`. Gemini must never
  be called from a test.

## 3. Project-specific rules

- **UI:** classic dark theme only (`:root` tokens); RTL; Persian user-facing
  strings; Morabba font. No redesign experiments.
- **Gemini tool schemas:** no integer enums; no array-form `type` — plain
  `'array'` only. String enums with Persian values are OK.
- **No reintroduction** of token economy, persona/Anna mode, gift modal, habit
  goals, or any separate sleep card. Keep migration cleanup code.
- **Sleep** is the builtin habit `builtin_sleep` (`#5b6bb0`).
- **No in-app changelog/branding text.**
- **State migrations** go in the `migrate()`-style cleanup in `app.js` (delete
  legacy keys, normalize shapes) — never silently drop user data.
- **Security:** no secrets in the client; escape untrusted text with `aiEsc`;
  validate every AI tool argument before mutating state (see `docs/SECURITY.md`).

## 4. Release flow

Version bumps, zip building, and GitHub steps: `docs/RELEASE.md`.
Commits: `type: summary` (feat/fix/chore/docs/test), body explains *why*.

## 5. Context hygiene

When work continues over long sessions: keep decisions in `SPEC.md` /
`CHANGELOG.md`, delete stale notes, and don't accumulate scratch files in the
repo. Point the next agent at the docs, not at chat history.
