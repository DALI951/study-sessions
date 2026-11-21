---
description: Run the Study Log test battery (pure logic tests) in this project.
agent: absolute
---

Run the tests for Study Log NOW, workdir = project root:

1. `node --test tests/*.test.mjs`
2. Report the exact pass/fail count and any failing assertion.
3. If a test fails, fix the root cause in `www/core.js` (or the test if the test is wrong), rerun until green.
4. Never edit code just to force a pass. Commit + push only after green.
