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

### Changed

- Applied Prettier formatting across the codebase (whitespace only).
- CI now checks formatting and runs end-to-end and accessibility tests.
- Corrected the implementation plan to show that SME sign-off and legal review are still pending.

### Security

- Applied non-breaking dependency updates from `npm audit fix`. Remaining advisories require major
  upgrades and are tracked in `ROADMAP.md`.

## [0.1.0] - 2026-07-15

### Added

- Phase 1 prototype: pure eligibility engine (SNAP, Medicaid/CHIP, WIC, LIHEAP, TANF), draft
  adapters for Ohio, Texas, and Washington with golden fixtures, React PWA with English and Spanish,
  privacy controls, encrypted save and resume, document generation, referral directory, offline
  support, and reference static hosting infrastructure.
