# Release flow

## 1. Quality gate (before anything)

```bash
cd tests && npm install && npm test      # 8/8 suites green
node --check app.js && node --check background.js
grep -c "tokenLedger\|giftModal\|شخصیت\|آنا" index.html   # must be 0
```

## 2. Version bump

- `app.js` → `const VERSION="X.Y.Z"`
- `manifest.json` → `"version": "X.Y.Z"`
- `tests/package.json` → `"version"`
- `CHANGELOG.md` → new section (repo file only — never in-app text)

## 3. Commit & tag

```bash
git add -A && git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
```

## 4. Zip (deliverable + installable)

From the repo root, excluding VCS/dep/test-install artifacts:

```bash
zip -rq ../outtask-vX.Y.Z.zip . -x ".git/*" -x "tests/node_modules/*"
```

The zip doubles as the load-unpacked folder (manifest at root).

## 5. GitHub

```bash
git push origin main --tags
```

Create a GitHub Release for the tag and attach `outtask-vX.Y.Z.zip`.
CI (`.github/workflows/test.yml`) must be green on the pushed commit.

## Versioning convention

- **patch** — fixes only
- **minor** — features / removals / migrations (this project's usual cadence)
- Releasing from a dirty tree or with failing tests is not allowed.
