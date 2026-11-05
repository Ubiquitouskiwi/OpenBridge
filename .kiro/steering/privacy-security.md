---
inclusion: fileMatch
fileMatchPattern:
  [
    'packages/web-app/src/store/**',
    'packages/web-app/src/lib/**',
    'packages/web-app/src/features/save/**',
    'packages/web-app/src/features/forms/**',
    'packages/web-app/src/features/referrals/**',
    'packages/web-app/vite.config.ts',
    'packages/web-app/index.html',
    'infra/**',
    '.github/workflows/**',
    'docs/PRIVACY_MODEL.md',
    'SECURITY.md',
  ]
---

# Privacy and security standards

Authoritative model: `docs/PRIVACY_MODEL.md`. Hard rules: `AGENTS.md` section 2 and `SECURITY.md`.
This file is the practical checklist for applying them.

## What counts as personal data

Anything a user enters or the app derives from it: household members, ages or birth dates,
relationships, pregnancy, disability, eligibility/immigration status, income, expenses, assets,
county, results, reason-code params, generated PDFs, and save files. Treat all of it as sensitive.

## Forbidden (reject in review)

- `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, `WebSocket`, or `<img>`/`<script>` loads that
  could carry personal data, or any request whose URL or body is built from user input.
- Third-party scripts, fonts, or CDNs loaded at runtime (everything ships in the bundle).
- Analytics, telemetry, session replay, A/B tooling, or remote error reporting.
- `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or the Cache API holding personal data.
  (The service worker caches only the app shell and public rule files.)
- `console.log` of state, profiles, results, or errors that include them. Remove debug logging
  before committing.
- Putting personal data in URLs, route params, query strings, or the document title.
- `autocomplete` left on for sensitive inputs; use `autoComplete="off"` where the browser would save
  values.

The only permitted runtime request is a same-origin GET of static public files: the app bundle,
rule data, and `deployment-config.json` (loaded in `packages/web-app/src/store/session.ts`). Those
requests carry no user data. Any new request must meet the same bar and be called out in the PR.

## Required

- All in-progress data lives in the Zustand stores and is wiped by `clearAllData()` (see
  `packages/web-app/src/store/clear.ts`). A new store must be added to the clear path and to its test.
- New data-collecting screens show the transparency banner.
- Individual mode keeps the inactivity auto-clear; navigator mode keeps manual lock and clear.
- Exports go through the explicit consent screen and show the privacy notice.
- Encryption stays WebCrypto PBKDF2 (SHA-256, 310,000+ iterations, random salt per file) plus
  AES-GCM (random IV per encryption), envelope `openbridge.save.v1`. No key storage, escrow, or
  recovery. Format changes need a new envelope version and a migration path.
- Referral contact is device-native (`tel:`, `mailto:`, plain links). No forms that post anywhere.

## Infrastructure and CI

- Hosting stays static: private bucket, HTTPS only, no public write, no server-side logic.
- Never weaken a public-access block, TLS enforcement, or an origin access control.
- Workflows use least-privilege `permissions:`, pin third-party actions to a major version or SHA,
  and never echo secrets. Deploy jobs must stay skipped when credentials are not configured.
- Local dev servers bind to `localhost` only.

## Dependencies

- Run `npm audit` when changing dependencies. Do not run `npm audit fix --force`; major upgrades
  go through review because they can change behavior.
- Report security issues privately per `SECURITY.md`, never in a public issue.
