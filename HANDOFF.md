# HANDOFF — Study Log

Updated 2026-11-21.

## Done
- Android WebView shell, manifest, theme, adaptive + legacy launcher icons.
- `www/index.html`, `www/style.css`, `www/app.js`, `www/core.js`: subjects, sessions, calendar, backup/restore.
- 12 logic tests green locally (`node --test tests/*.test.mjs`), syntax checks green.
- GitHub Actions workflow: test → Gradle 8.9 `assembleDebug` → artifact → release `v1.0.0`.
- Repo contract: `RULES.md`, this file, `AGENTS.md`, `.opencode/commands/{battery,ship}.md`.

## In progress
- GitHub push + CI build verification (update this line after the run is observed).

## Next
- Confirm the CI run is SUCCESS and the release asset exists; put the direct APK URL in `README.md` if needed.

## Blocked
- None known yet.

## Environment
- CI: ubuntu-latest, JDK 17, Android SDK 35, Gradle 8.9 downloaded in-job.
- Local Termux: Node 24 available; no JDK/Gradle, so the APK is built on GitHub.

## Watch-outs
- Debug-signed APK → future versions require reinstall unless signing secrets are added.
- Do not change the theme to dark/red. Warm paper + one teal accent is a dated decision in `RULES.md`.
- Data lives in WebView localStorage; clearing app data wipes it. Backup sheet is the only recovery path.
