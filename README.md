# Study Log

An offline Android app for counting study sessions. Type a subject name, add sessions to it, and see every session on a month calendar.

**APK:** https://github.com/DALI951/study-sessions/releases/tag/v1.0.0

## What it does
- **Subjects** — add, rename, delete. Each card shows how many sessions you logged and when you last studied it.
- **Sessions** — log a subject, date, minutes and an optional note. Tap "Log session" any time; it defaults to today and 25 minutes.
- **Calendar** — Monday-first month grid. Days you studied get a dot and a session count; tap a day to see that day's sessions.
- **Overview** — total sessions, sessions this week, and a day streak (counts through yesterday so you don't lose it before studying today).
- **Backup** — the data button exports/imports a JSON backup and can erase everything. All data stays on the device.

## Install
1. On your phone, open the APK link above in Chrome.
2. Download the `.apk`, then tap it.
3. Allow "Install unknown apps" for Chrome if Android asks.
4. Open Study Log from the app drawer.

No account, no internet permission, no tracking.

## Build it yourself
GitHub Actions builds the APK on every push to `main`, then publishes it on the `v1.0.0` release. Manual trigger:

```bash
gh workflow run build-apk.yml --repo DALI951/study-sessions
```

Local tests (Node 18+, zero dependencies):

```bash
cd study-sessions
node --test tests/*.test.mjs
```

Local APK build needs JDK 17, Android SDK platform 35 + build-tools 35.0.0 and Gradle 8.9:

```bash
cd study-sessions
gradle assembleDebug
# APK: build/outputs/apk/debug/app-debug.apk
```

Regenerate launcher icons (zero dependencies):

```bash
cd study-sessions
node scripts/gen-icons.mjs
```

## Layout
- `www/core.js` — pure logic and validation (tested)
- `www/app.js` — UI, sheets, calendar rendering
- `www/style.css` — warm paper + single teal accent
- `src/main/` — Android WebView shell and launcher icons
- `.github/workflows/build-apk.yml` — test → build → release
- `RULES.md` / `HANDOFF.md` — working contract

APK is debug-signed: an update will need a reinstall until release signing is configured.
