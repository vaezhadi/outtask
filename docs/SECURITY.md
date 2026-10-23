# Security

> "Vibe coding is fun until you start leaking database credentials." — production
> needs more than functional code. Security checklist from *Beyond Vibe Coding*
> applied to Outtask.

## Checklist (verify before each release)

- [x] **Input validation & sanitization** — every Gemini tool argument is validated
  before use (e.g. `hmToMinOrNull`, `normalizeHabit`, status enums); unknown ids
  are ignored rather than trusted.
- [x] **No secrets in the client** — the v2.8 removal eliminated an embedded
  API-key placeholder. Never hardcode keys/tokens in `app.js`, `background.js`
  or `index.html`. CI greps for suspicious literals.
- [ ] **API keys** — the user's own Gemini key lives in `settings.aiApiKey`
  (local only, exported only in their own JSON backup). Accepted risk for a
  personal offline tool; never send it anywhere except Google's API endpoint.
- [x] **XSS protection** — AI/user text goes through `aiEsc` before HTML; no
  `innerHTML` with unescaped external content. (Verify when touching renderers.)
- [x] **Auth/authz** — N/A (single-user, local). AI capabilities are capped by
  `aiCaps` and only editable via the shield popup.
- [x] **Injection** — no SQL (no DB server). Tool args are typed-checked; enums
  are string-checked.
- [x] **HTTPS** — only `https://` endpoints (Gemini API).
- [x] **CSP** — `manifest.json`: `script-src 'self'; object-src 'self';`. No
  remote scripts, no eval.
- [x] **Permissions review** — `storage, unlimitedStorage, notifications,
  alarms, tabs, scripting, offscreen` each serve a documented feature
  (alarms/notifications → alarms; scripting/tabs → eye-care overlay; offscreen →
  alarm audio). `host_permissions: <all_urls>` is required by the eye-care
  content script only. Re-review whenever manifest changes.
- [x] **Dependency hygiene** — the extension ships **zero** runtime dependencies.
  Dev deps live only in `tests/` (jsdom).

## Data handling

- All user data stays on-device (`localStorage` + IndexedDB).
- JSON export is user-initiated and local.
- Legacy keys (tokens/persona/YouTube) are actively deleted by migration code —
  keep those deletions.
