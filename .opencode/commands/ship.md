---
description: Test Study Log, commit/push, then trigger the GitHub APK build and confirm the release asset.
agent: absolute
---

Ship Study Log end to end, workdir = project root:

1. Run `node --test tests/*.test.mjs`. Stop if not fully green.
2. Refresh `HANDOFF.md` with honest current state.
3. `git add -A` + commit with a descriptive message + `git push` (never force).
4. `gh workflow run build-apk.yml --repo DALI951/study-sessions`, then
   `gh run list --workflow build-apk.yml --repo DALI951/study-sessions --limit 1` and watch with
   `gh run watch <run-id> --repo DALI951/study-sessions`.
5. Verify `gh release view v1.0.0 --repo DALI951/study-sessions` lists the APK asset.
   Report the direct download URL only after that check passes.
