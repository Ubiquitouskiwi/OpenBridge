# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Reference data carries its own
`dataVersion`.

## [Unreleased]

### Added

- **Repository trust tooling:** a dependency review check on every pull request (blocks known
  vulnerabilities and licenses that do not fit AGPL-3.0), a weekly OpenSSF Scorecard check,
  signed build provenance for every release download (`gh attestation verify`), live CI, CodeQL,
  Scorecard, and release badges, `SUPPORT.md`, `CITATION.cff`, release-note categories,
  `.gitattributes`, and a Codespaces dev container.

- **Screenshots:** `docs/screenshots/` holds 25 pictures of the screening app and the rule toolkit,
  made from the real app with a made-up household by `npm run screenshots` (Playwright, fixed
  date, loopback-only server). The README and 9 wiki pages now show them, and
  `npm run check:wiki` fails if a wiki picture is missing.

- `AGENTS.md` operating contract and `.kiro/steering/` standards for AI-assisted development
  (product, tech, structure, engineering, eligibility rules, privacy and security, UI and
  accessibility, testing, git and review).
- `npm run verify` single quality gate, `npm run format`, `npm run format:check`, `npm run e2e`.
- Public repository files: README, ROADMAP, LICENSE (AGPL-3.0), Code of Conduct, issue and PR
  templates, Dependabot configuration, Architecture Decision Records.
- Project white paper, now in `docs/whitepaper/` with every version kept (`_v1.0`, `_v1.1`).
  Version 1.1 makes the privacy claim precise (no personal data collected, stored, or sent; hosts
  may keep standard connection logs), adds organizational footing and liability and distribution
  as launch blockers, holds immigration-related wording until counsel approves it, plans the
  referral directory depth first, adds a 90-day plan, and states plainly that expert reviewers
  are still needed.

- **Show the math:** every result can expand into the step-by-step calculation (household size,
  income, poverty line, limit, SNAP deductions and benefit), each rule value linked to its cited
  source or marked "not listed yet". The engine returns this as a `calculation` trace of codes.
- **What-if and benefit cliffs:** a `/what-if` page shows how results change with more or less
  monthly income and where each program, and each person's coverage, may change or stop.
- **Test-case recorder for rule reviewers:** `/review` turns a made-up screening into a golden
  fixture file without writing code.
- **MCP server for AI agents** (`packages/mcp-server`): four read-only tools
  (`list_supported_states`, `get_program_rules`, `screen_household`, `explore_income_change`)
  and a screening-guide prompt, over stdio or loopback HTTP. ADR-0003.
- **One-button releases:** a GitHub Actions workflow publishing a hosted download (static site,
  Dockerfile, Compose, nginx and Caddy examples, no-dependency `serve.mjs`), a single-file local
  download that opens from disk offline, and amd64/arm64 container image tarballs, with checksums
  and build info. Nothing is pushed to a registry. ADR-0004, `docs/RELEASING.md`.
- Root `Dockerfile` (non-root nginx, health check, OCI labels) and a CI job that builds and
  smoke-tests the image.
- **Community rule toolkit** (`packages/rule-toolkit`, ADR-0005): a single offline file for policy
  and legal experts to review a state's rules against their sources, propose rule changes with a
  citation, and check test cases, with no code. Released as `openbridge-rule-toolkit-v*.zip`.
  Maintainers apply proposals with `npm run rules:apply -- proposal.json`, which refuses stale
  proposals and keeps adapters `draft`. Shared catalog and proposal logic live in
  `packages/shared`.
- **GitHub wiki** (source in `wiki/`): plain-language guides for using, hosting, reviewing rules,
  recording test cases, translating, and developing, published by `.github/workflows/wiki.yml`.
  `npm run check:wiki` (part of `npm run verify`) checks links, the sidebar, and copy rules.

### Changed

- Upgraded to Node 24 LTS for tooling, Vite 8, Vitest 5, Zod 4, React Router 7,
  `@vitejs/plugin-react` 6, and `vite-plugin-pwa` 2. The lockfile was regenerated.
- ESLint 10 (to match the `@eslint/js` 10 Dependabot update) and i18next 26 in the web app (to
  match react-i18next 17). This puts `package-lock.json` back in sync so `npm ci` works in CI.
  Dependabot now groups packages that must move together.
- The skip link and Terms of Use footer link now go through i18n and the router (they were
  hardcoded English and caused full page reloads).
- Applied Prettier formatting across the codebase (whitespace only).
- CI now checks formatting and runs end-to-end and accessibility tests.
- Corrected the implementation plan to show that SME sign-off and legal review are still pending.

### Security

- Dependency upgrades cleared all critical and high advisories. Production dependencies report no
  known vulnerabilities; remaining advisories are moderate or low, in dev tooling only.
- Hosting examples ship a strict Content-Security-Policy and related headers; fixed the nginx
  example, where `add_header` inside `location` blocks silently dropped the server-level headers.

## [0.1.0] - 2026-07-15

### Added

- Phase 1 prototype: pure eligibility engine (SNAP, Medicaid/CHIP, WIC, LIHEAP, TANF), draft
  adapters for Ohio, Texas, and Washington with golden fixtures, React PWA with English and Spanish,
  privacy controls, encrypted save and resume, document generation, referral directory, offline
  support, and reference static hosting infrastructure.
