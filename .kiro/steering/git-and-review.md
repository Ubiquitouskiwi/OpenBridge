---
inclusion: always
---

# Git, review, and change records

## Branches

- `mainline` (the default branch) is always releasable and protected. Work on short-lived branches named
  `<type>/<short-description>`, e.g. `feat/tx-tanf-adapter`, `fix/snap-min-benefit`.
- Agents never push to `mainline`, force-push shared branches, or rewrite published history.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <imperative summary, 72 chars max>

<why the change is needed and what it does; wrap at 100>

Refs: #<issue>, requirements 5.1.4
Assisted-by: <agent or model name>
```

- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `data`.
  Use `data` for state adapter, federal table, fixture, or referral changes.
- Scopes: `engine`, `shared`, `forms`, `web-app`, `data`, `infra`, `ci`, `docs`, or a state code
  (`oh`, `tx`, `wa`).
- One logical change per commit. Formatting-only changes go in their own commit.
- `Assisted-by:` is required on any commit an AI agent wrote or substantially drafted.
- Breaking changes use `!` (`feat(engine)!: ...`) and a `BREAKING CHANGE:` footer.

## Pull requests

- Fill in every section of `.github/PULL_REQUEST_TEMPLATE.md`.
- Link the issue and the requirement or decision IDs the change serves.
- Keep PRs reviewable: aim for under about 400 changed lines excluding lockfiles and fixtures.
- CI must be green. At least one human maintainer approves every PR, including AI-authored ones.
- Rule-value changes need a cited source in the PR and, before an adapter is marked verified, SME
  sign-off recorded in `docs/SME_SIGNOFF.md`.

## Changelog

- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
- Add user-visible changes under `## [Unreleased]` in the same PR, grouped as Added, Changed,
  Fixed, Removed, Security, or Data.

## Architecture Decision Records

- Significant or hard-to-reverse decisions (new dependency, privacy model change, outcome ladder
  change, data format change, new program or hosting model) get an ADR in `docs/adr/`.
- Copy `docs/adr/0000-template.md` to the next number, fill it in, and link it from the PR.
- Historical decisions Q1 to Q43 live in the requirements Decisions Log; do not duplicate them.
- ADRs are never edited after acceptance except to mark them superseded by a newer ADR.

## Versioning

Semantic Versioning for releases. Reference data carries its own `dataVersion`; a data-only release
bumps the patch version and `dataVersion`.
