# RULES — Study Log

Binding for this repo. If it conflicts with a default, this file wins.

## Stack
- Single-module Android app: Java 17, AGP 8.7.3, Gradle 8.9, compileSdk/target 35, minSdk 21.
- UI = offline WebView loading `file:///android_asset/index.html`. Assets live in `www/` (mapped in `build.gradle`).
- No network, no accounts, no backend. Data = `localStorage` key `study-sessions.v1`.
- Logic is pure in `www/core.js` and is the ONLY place business rules change. UI in `www/app.js`.

## Commands (workdir = repo root)
- Tests: `node --test tests/*.test.mjs` (or `npm test`).
- Regenerate launcher PNGs: `node scripts/gen-icons.mjs` (zero deps).
- Build APK locally (if Android SDK + Gradle 8.9 installed): `gradle assembleDebug`.
- CI: push to `main` → `.github/workflows/build-apk.yml` tests, builds, uploads artifact, publishes/updates release `v1.0.0`.
- Manual CI: `gh workflow run build-apk.yml --repo DALI951/study-sessions`.

## Conventions
- Keep the theme: warm paper `#f6f2ea`, surface `#ffffff`, ink `#1c2b28`, ONE accent teal `#0f766e`.
  No near-black, no red dashboard, no second accent. Destructive text may use a muted brick, never a bright red theme.
- 3 type sizes max per screen, 4px spacing grid, cards 16px radius + hairline border, motion 150–180ms ease-out.
- Inline SVG icons only — no emoji. Visible focus ring on every interactive element.
- Escape ALL dynamic text inserted with `innerHTML` via `esc()` in `app.js`.
- Dates are local `YYYY-MM-DD` strings. Calendar is Monday-first, 42 cells. Never use UTC for "today".
- `data` is one long-lived object. Mutate it in place; don't replace the object reference. Arrays may be replaced only on restore/erase.
- Every new rule/feature ships with tests in `tests/logic.test.mjs` in the SAME change. Final state must be all green.
- No secrets in this repo. It is public.

## Do not
- Don't add Firebase, analytics, ads, or Internet permission — the app must stay offline.
- Don't switch to Flutter/Capacitor without a dated decision in this file.
- Don't retheme to dark+red "for consistency" — that identity is retired.
- Don't store credentials, tokens, or keyfile paths in memory files or this repo.
- Don't claim an APK works from a green build alone: download it, install it, open it, THEN say verified.

## Decisions
- 2026-11-21: hand-rolled WebView + AGP instead of Flutter/Capacitor — smaller APK, fewer moving parts, CI-only build.
- 2026-11-21: one accent (teal) on warm paper because studying/reading needs calm contrast, not a night dashboard.
- 2026-11-21: release asset is always `study-sessions-v1.0.0.apk` on tag `v1.0.0`; CI re-uploads with `--clobber` so the link never changes.
- 2026-11-21: debug-signed APK. Updating later requires reinstall unless signing secrets are added (then update this line).
- 2026-11-21: data is local-only; Backup sheet exports/imports JSON manually. No sync, no cloud.
