# Testing

> Test ruthlessly after every change — no exceptions (`Beyond Vibe Coding` rule #4).

## Run

```bash
cd tests
npm install        # jsdom only
npm test           # runs all 8 suites via run-all.js
```

CI runs the same on every push (`.github/workflows/test.yml`).

## Suites

| Suite | Covers |
|---|---|
| `multistep.js` | Multi-step task flow (fake-DOM/vm) |
| `vibe3.js` | Vibe check-ins, stats, trends |
| `v26.js` | Sleep-as-habit, timer-only activities, daily review policy |
| `dom-multistep.js` | Multi-step UI (jsdom) |
| `dom-v3.js` | Time tab, timer, manual sessions UI (jsdom) |
| `dom-habits2.js` | Habits tab UI (jsdom) |
| `dom-v4.js` | Dashboard, sleep habit card, review UI (jsdom) |
| `dom-export.js` | Day-image export: blocks, label layout, PNG download |

## Rules

1. **No live network.** Stub `fetch`. A test that calls Gemini or YouTube is a
   bug (and CI would hit 429s). Keep the `fetch=async()=>({ok:false,...})` stubs.
2. **Two harnesses:**
   - `harness.js` — fake DOM + `vm.runInThisContext(app.js)` for pure logic tests.
   - `JSDOM.fromFile('../index.html', {runScripts:'dangerously', resources:'usable'})`
     for real DOM/boot tests. Mock `HTMLCanvasElement.getContext`, `Audio`,
     `toBlob`, `URL.createObjectURL`, `confirm/alert`.
3. **Portable paths only** — `path.join(__dirname,'..')`. No absolute paths.
4. `console.error` during boot is treated as a failure in dom suites — keep boot clean.
5. Adding a feature = adding/ extending a suite in the same commit.
