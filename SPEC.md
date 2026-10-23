# Outtask — SPEC (mini-PRD)

> Plan first, code later. This spec is the source of truth for intent, scope, and
> hard constraints. AI agents must read this before changing anything (see `AGENTS.md`).

## Problem

A Persian-speaking solo user needs one offline-first place to plan the day, track
where time actually goes, keep habits (including sleep), and get an honest daily
AI review — without gamification noise or English-only tooling.

## User & product principles

- **Persian / RTL first.** Every user-facing string is Persian (fa). Latin only for
  technical tokens (HH:MM is shown with Persian digits via `faNum`).
- **Classic dark theme only.** The "OutVibe" (v2.1) redesign was permanently
  rejected. Colors are the `:root` tokens in `index.html`.
- **Offline-first.** All state in `localStorage` (+ IndexedDB backup). Network only
  for the user's own Gemini key and alarm/timer flows.
- **No gamification.** No coins, gifts, streak pressure. (Token economy and the
  Anna/persona mode existed in ≤2.5 and were **removed in 2.6** — never
  reintroduce.)
- **No in-app changelog/branding/report text.** Release notes live in `CHANGELOG.md`.

## Modules (current)

| Module | What it does |
|---|---|
| Tasks | Day tasks, folders, statuses (done / not-done / postponed), priorities, multi-step (AI-only, 2–6 steps, one square at a time, descriptions popup mandatory) |
| Habits | Bullet-journal tracker, repeats (daily/weekly/monthly), day coloring: missed = red, done = green, non-scheduled/future/open-today neutral; routine («عادت عادی») habits hatch on the clock only |
| Sleep | Builtin habit `builtin_sleep`, color `#5b6bb0`, bed/wake pickers on the habit card, overnight session (bed ≥ 12:00 ⇒ previous evening), wake-day attribution |
| Calendar | Jalali calendar, occasions (JSON import), notes |
| Time tracking | Dual AM/PM clock (inner AM 0–11, outer PM 12–23), timer + manual sessions, timer-only activities (rest/food/commute/custom) |
| AI planning | Hatched time plans on the clock (AI tool `plan_day`), alignment hatch→solid+black line |
| Alarms | One-shot + repeating alarms with sounds |
| Vibe | Mood/fatigue check-ins, 7/30-day trends |
| AI assistant | Gemini tool-calling chat; capabilities granted only via the shield popup; no suggestion cards/branding; composer hugs bottom |
| Daily AI review | Automatic at the day-end hour (catch-up on first open); score is **relative to the user's own history**: 100 is impossible, 90+ only exceptionally (≥125% of personal best), hard-but-below-trend ⇒ lower number + encouraging analysis; prompt includes yesterday + day-before-yesterday + best-ever day |
| Day image export | Button «عکس روز» in the planning card → PNG of the viewed day: scheduling clock with **a leader line per band and the task name + time written outside** |

## Hard constraints (violations = rejected work)

These are standing product decisions. Do not "fix" or redesign them.

1. **Gemini tool schemas:** never use integer enums; never use array-form `type`
   (`type:['array','null']` breaks the API) — use plain `'array'` and empty-array
   semantics. String enums with Persian values are fine.
2. **Thinking level** is a free-text input (`off/low/medium/high` or a number) —
   not segmented buttons (v2.5.1 decision).
3. **No live network calls in tests.** Stub `fetch`; Gemini never runs in CI.
4. **Habit goals are permanently removed.** No manual habit icon picker (icons are
   suggested from the title).
5. **Routine habits** draw deterministic time-window hatches on the clock
   (band radii 238/358; solid 220/340 in canvas units).
6. **Sleep is a normal habit** shown in the habits tab with its special color; the
   separate sleep card in the time tab must not come back.
7. **Token economy / Anna persona / gift modal** — removed in 2.6. Keep the
   migration cleanup that deletes their storage keys.
8. **Scores, reviews, and analysis stay honest** — easy days score low, hard days
   high; below personal trend ⇒ lower numeric score but encouraging text.

## Non-goals

- Mobile apps, cloud sync, multi-user, English UI, gamification, store publishing.

## Success criteria

- All suites green (`tests/`), zero live network calls during tests.
- Day image export shows every clock band labeled outside the dial.
- Daily review scores track the user's own history per the rules above.
- The app loads unpacked in Chrome with no console errors on boot.
