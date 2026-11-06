# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Reference data carries its own
`dataVersion`.

## [Unreleased]

### Added

- `AGENTS.md` operating contract and `.kiro/steering/` standards for AI-assisted development
  (product, tech, structure, engineering, eligibility rules, privacy and security, UI and
  accessibility, testing, git and review).
- `npm run verify` single quality gate, `npm run format`, `npm run format:check`, `npm run e2e`.
- Public repository files: README, ROADMAP, LICENSE (AGPL-3.0), Code of Conduct, issue and PR
  templates, Dependabot configuration, Architecture Decision Records.
- Project white paper (`OpenBridge_White_Paper.pdf`).

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

### Changed

- Upgraded to Node 24 LTS for tooling, Vite 8, Vitest 5, Zod 4, React Router 7,
  `@vitejs/plugin-react` 6, and `vite-plugin-pwa` 2. The lockfile was regenerated.
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
