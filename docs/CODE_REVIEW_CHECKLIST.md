# Code review checklist (quality gates)

Every change — human or AI-generated — is reviewed like a junior dev's PR
(*Beyond Vibe Coding*: "always review AI-generated code"). The human is the
editor-in-chief.

## Universal gates

- [ ] **Logic & edge cases** — midnight splits, empty states, empty arrays,
      yesterday/tomorrow views, zero durations.
- [ ] **Security** — `docs/SECURITY.md` checklist, especially escaping and
      tool-argument validation.
- [ ] **Performance** — no O(n²) per-second work; timers/intervals cleaned up;
      canvas redraws stay cheap.
- [ ] **Style & maintainability** — matches existing patterns (render* functions,
      `save()` discipline, `try/catch` around chrome.* APIs); no dead code.
- [ ] **Error handling** — user-visible failures are Persian and actionable;
      silent catches only where failure is truly optional.
- [ ] **Tests** — suite added/updated and green (`cd tests && npm test`); no live
      network; no absolute paths.
- [ ] **Docs** — `SPEC.md` constraints honored; `CHANGELOG.md` updated for user
      visible changes; no changelog/branding text inside the app.
- [ ] **Dependencies & licensing** — no new runtime deps; assets are CC0/own
      (`docs/ATTRIBUTION.md`).

## Project-specific gates

- [ ] `SPEC.md` hard constraints respected (Gemini schema rules, theme, sleep,
      scoring policy, removed features stay removed).
- [ ] RTL/Persian strings render correctly; `faNum` used for numbers in UI text.
- [ ] Migration/cleanup code kept for legacy storage keys.
- [ ] `node --check app.js background.js` passes; boot has zero `console.error`.
