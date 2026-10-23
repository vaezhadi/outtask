# Architecture

Chrome MV3 extension, no build step. `manifest.json` at repo root = load unpacked.

## File map

| File | Role |
|---|---|
| `index.html` | All UI (single page, RTL, dark theme tokens in `:root`), inline CSS |
| `app.js` | Entire app logic (~5.9k lines): state, rendering, timer, AI tools, review |
| `background.js` | Service worker: eye-care alarm, user alarms (repeat), notifications |
| `content-eye-care.js` | Injects the 20-20-20 eye-break overlay on pages |
| `offscreen-audio.*` | Offscreen document for alarm sounds (MV3 requirement) |

## Data model

- `state` (in `app.js`): `tasks`, `folders`, `sessions`, `plans`, `alarms`,
  `habits`, `habitLogs`, `vibeEntries`, `aboutMe`, `dayReviews`, `aiChat`,
  `settings`, `occasions`, `notes`. Persisted to `localStorage` and mirrored to
  IndexedDB (`save()` → `saveToIDB`). Global mirror for tests: `__outtaskState`.
- **Migrations** live in the normalize/migrate block near the top of `app.js`:
  normalize shapes and **delete legacy keys** (tokens/persona v2.6, YouTube v2.8).
- JSON backup export/import in Settings (`outtask-export-v{VERSION}.json`).

## Sleep model

- Habit `builtin_sleep` (color `#5b6bb0`), never time-windowed.
- Bed ≥ 12:00 ⇒ the sleep belongs to the previous evening (`sleepRangeForDay`);
  the **wake day** owns the record (`findDaySleep` looks at the morning).
- Sessions clip at day boundaries; the clock draws sleep dashed.

## The clock (time tab)

- Canvas 900×900. Two rings: **inner = AM (0–11)**, **outer = PM (12–23)**;
  hour ticks, plan hatches (`drawHatchBand`), sessions as colored arcs.
- Plans: `plan = {id,title,color,date,startMin,endMin,taskId?}`; habit windows
  appear as virtual "stub" plans (`habitPlanStubs`). `classifyPlan` splits each
  planned minute into align/miss/future → hatch (future) vs solid+black line
  (done as planned) vs nothing (missed).
- Day image export (`buildDayImage`) reuses this geometry and adds leader-line
  labels outside the dial.

## AI integration

- Gemini `generateContent` (`geminiRawChat`) with `tools[0].functionDeclarations`.
  Schema rules in `SPEC.md` (no integer enums, no array-form `type`).
- Tool results are sent back as `functionResponse` parts; model parts are echoed
  verbatim (incl. `thoughtSignature`).
- Capabilities are gated by `settings.aiCaps`, edited only in the shield popup.
- The daily review (`runDailyReview`) parses loose JSON → `applyScorePolicy`
  enforces the relative-scoring rules.

## Numbers to keep consistent

- Routine-habit clock bands: hatch radii 238/358, solid 220/340 (canvas units).
- Export canvas: rings 338/218, thickness 36, labels spread ≥60px per side.
