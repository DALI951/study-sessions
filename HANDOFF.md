# HANDOFF — Study Log

Updated 2026-11-21 after CI run `44935486353` (SUCCESS).

## Done
- Android WebView shell, manifest, theme, adaptive + legacy launcher icons.
- `www/index.html`, `www/style.css`, `www/app.js`, `www/core.js`: subjects, sessions, calendar, backup/restore, in-app confirmations.
- 12 logic tests green locally; JS syntax checks green; icon PNGs decoded and pixel-checked.
- GitHub Actions run `44935486353`: tests green, Gradle 8.9 `assembleDebug` green, APK published on release `v1.0.0`.
- Release asset verified: `study-sessions-v1.0.0.apk`, 38,783 bytes, contains `assets/index.html`, `assets/app.js`, `assets/core.js`, `assets/style.css`, `classes.dex`, `AndroidManifest.xml`; direct URL returns HTTP 200.
- Repo contract: `RULES.md`, this file, `AGENTS.md`, `.opencode/commands/{battery,ship}.md`.

## In progress
- Final rebuild after replacing `window.confirm` with themed in-app confirmations (push pending).

## Next
- Confirm the new CI run is SUCCESS and the release asset digest changed.
- Install on phone and eyeball the UI — runtime look on a real device is NOT verified from CI alone.

## Blocked
- No device/emulator available here, so on-screen rendering stays UNVERIFIED.

## Environment
- CI: ubuntu-latest, JDK 17, Android SDK 35, Gradle 8.9 downloaded in-job.
- Local Termux: Node 24 available; no JDK/Gradle, so the APK is built on GitHub.

## Watch-outs
- Debug-signed APK → future versions require reinstall unless signing secrets are added.
- Do not change the theme to dark/red. Warm paper + one teal accent is a dated decision in `RULES.md`.
- Data lives in WebView localStorage; clearing app data wipes it. Backup sheet is the only recovery path.
