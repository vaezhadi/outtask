# Outtask · اوت‌تسک

**Persian midnight task manager** — Jalali calendar, colored time tracking on a dual
AM/PM clock, habit tracker with sleep, hatched AI time-planning, repeating alarms,
and an honest daily AI review. Chrome MV3, offline-first, classic dark theme.

**نسخه ۲.۸.۰** — افزونه‌ی کروم برای برنامه‌ریزی روز، ثبت زمان، عادت‌ها (با خواب)،
برنامه‌ریزی زمانی با هوش مصنوعی و مرور روزانه. بدون اینترنت کار می‌کند؛ داده‌ها روی
سیستم خودت می‌ماند.

## Features

- **Tasks & multi-step flows** (AI creates 2–6 steps; one square at a time)
- **Habits** with bullet-journal day coloring + **sleep as a habit** (bed/wake)
- **Time tracking**: timer, manual sessions, timer-only activities, full-day timeline
- **AI planning** on the clock (hatched windows → solid when done as planned)
- **Daily AI review** scored **relative to your own history** (100 is impossible)
- **Day image export** («عکس روز»): the scheduling clock with every band labeled
  outside — task name + the time it was done
- **Alarms**, **vibe check-ins**, **Jalali calendar** with occasions

## Install (Chrome)

1. `git clone` this repo (or unzip a release)
2. `chrome://extensions` → Developer mode → **Load unpacked** → select this folder

## Develop

```bash
cd tests && npm install && npm test    # full suite (no live network)
node --check app.js                    # syntax gate
```

This project is developed with **AI-assisted engineering** following the rules of
*Beyond Vibe Coding: From Coder to AI-Era Developer* (Addy Osmani, O'Reilly 2025):

- `SPEC.md` — mini-PRD: intent + hard constraints (plan first)
- `AGENTS.md` — global rules for AI coding agents
- `tests/` — 8 suites, run after **every** change
- `docs/CODE_REVIEW_CHECKLIST.md` — human+AI quality gates
- `docs/SECURITY.md`, `docs/TESTING.md`, `docs/RELEASE.md` — production practice

## Structure

```
app.js index.html background.js   # the extension (manifest at root)
docs/                             # architecture, security, testing, release
tests/                            # node + jsdom suites (npm test)
.github/                          # issue/PR templates + CI workflow
SPEC.md AGENTS.md CHANGELOG.md
```

## Docs

| Doc | Purpose |
|---|---|
| [SPEC.md](SPEC.md) | What we build and the hard constraints |
| [AGENTS.md](AGENTS.md) | Rules for AI agents working on this repo |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | File map, data model, geometry |
| [docs/TESTING.md](docs/TESTING.md) | Test strategy and suites |
| [docs/SECURITY.md](docs/SECURITY.md) | Security checklist (production-ready) |
| [docs/CODE_REVIEW_CHECKLIST.md](docs/CODE_REVIEW_CHECKLIST.md) | Quality gates |
| [docs/RELEASE.md](docs/RELEASE.md) | Versioning, zip, GitHub release |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md) | Third-party assets & licenses |
