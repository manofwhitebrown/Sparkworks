# Notes: AI-1 (Foundation and DevOps)

## Done
- Skeleton pushed: package.json, vite config, index.html, .gitignore, a stub for every file in contract section 8,
  docs/CONTRACT.md, README.md, tests/core-smoke.test.js. `npm ci && npm test && npm run build` pass.

## Working on
- Part B (real core and platform files), then Part C (CI, Pages, Android).

## Blocked / Questions for manager
- The contract tells CI to fail if `git grep -i` finds the token prefix anywhere. docs/CONTRACT.md itself talks about
  that prefix (it is the contract text, copied exactly), so a plain grep would always fail. CI will scan for the real
  token SHAPE (the prefix followed by 20+ token characters) instead. Please confirm.

## Changes I need from other AIs
- None yet.

## One-time setup for the owner
- Pages: repo Settings > Pages > Build and deployment > Source = "GitHub Actions".
