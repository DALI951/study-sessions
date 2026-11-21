# HANDOFF — Study Log

Updated 2026-11-21 after CI run `44935733434` (SUCCESS).

## Done
- Android WebView shell, manifest, theme, adaptive + legacy launcher icons.
- `www/index.html`, `www/style.css`, `www/app.js`, `www/core.js`: subjects, sessions, calendar, backup/restore, in-app confirmations.
- 12 logic tests green locally; JS syntax checks green; icon PNGs decoded and pixel-checked.
- Final CI run `44935733434`: tests green, Gradle 8.9 `assembleDebug` green, APK republished on release `v1.0.0`.
- Release asset verified: `study-sessions-v1.0.0.apk`, 39,035 bytes, sha256 `b8905389…f8348f722`.
  Contents checked: `assets/index.html`, `assets/app.js` (0 `window.confirm`, 6 `askConfirm`), `assets/core.js`, `assets/style.css`, `classes.dex`, `AndroidManifest.xml`. Direct URL HTTP 200.
- Repo contract: `RULES.md`, this file, `AGENTS.md`, `.opencode/commands/{battery,ship}.md`.

## In progress
- Nothing.

## Next
- Install on phone and eyeball the UI — on-screen rendering is NOT verified from CI alone.

## Blocked
- No device/emulator available here, so real-device runtime look stays UNVERIFIED.

## Environment
- CI: ubuntu-latest, JDK 17, Android SDK 35, Gradle 8.9 downloaded in-job.
- Local Termux: Node 24 available; no JDK/Gradle, so the APK is built on GitHub.

## Watch-outs
- Debug-signed APK → future versions require reinstall unless signing secrets are added.
- Do not change the theme to dark/red. Warm paper + one teal accent is a dated decision in `RULES.md`.
- Data lives in WebView localStorage; clearing app data wipes it. Backup sheet is the only recovery path.
