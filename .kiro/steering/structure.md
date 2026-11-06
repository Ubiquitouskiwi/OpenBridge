---
inclusion: always
---

# Repository structure

```
packages/
  shared/              Types, money/date utils, reason-code keys. Depends on nothing.
  eligibility-engine/  Pure rules engine. Depends only on shared.
    src/programs/      One evaluator per program (snap, medicaid, wic, liheap, tanf) + tests.
  form-assembly/       Document model -> PDF. Depends on shared.
  web-app/             React PWA: UI, i18n, stores, crypto, service worker.
    src/features/      Feature folders (intake, results, forms, save, referrals, dashboard).
    src/routes/        Thin route components that compose features.
    src/store/         Memory-only Zustand stores.
    src/i18n/          i18next config, renderReason(), locale JSON.
    src/lib/           Browser utilities (crypto).
    e2e/               Playwright specs.
    vite-plugins/      Build plugins (single-file inlining for the offline local download).
  mcp-server/          MCP server exposing the engine to AI agents (stdio + loopback HTTP).
                       Depends on shared + eligibility-engine; reads data/ and en locales as JSON.
  org-dashboard/       Phase 2 placeholder (no code).
packaging/
  hosted/              Files shipped in the hosted release (serve.mjs, Dockerfile, nginx, Caddy).
  local/               Files shipped in the single-file local release.
data/
  federal/             FPL tables (contiguous/AK/HI), SNAP federal values, sources.json.
  states/<code>/       adapter.json + fixtures/*.json per state.
  referrals/           Static referral directory.
scripts/               Seeding and CI checks (validate adapters, fixtures, reason keys, readability).
  release/             Release packaging (package-release.ts).
infra/                 Reference static-hosting infrastructure (AWS CDK).
docs/                  Privacy model, adapters guide, deployment, a11y checklist, ADRs, sign-offs.
wiki/                  GitHub wiki source (flat *.md pages, _Sidebar.md, _Footer.md), published by
                       .github/workflows/wiki.yml and checked by `npm run check:wiki`.
.kiro/specs/openbridge/  requirements.md, design.md, tasks.md (source of truth for behavior).
.kiro/steering/        Agent standards (this folder).
```

## Placement rules

- New program logic: `packages/eligibility-engine/src/programs/<program>.ts` with a colocated test,
  registered in `programs/index.ts`.
- New shared type or reason-code key: `packages/shared/src/` (keys only, no English text).
- New UI feature: a folder under `packages/web-app/src/features/<feature>/`; the route file only
  wires it up.
- New state: `data/states/<lowercase code>/adapter.json` plus at least three fixtures.
- New CI check: a script in `scripts/`, an npm script in the root `package.json`, a step in
  `.github/workflows/ci.yml`, and inclusion in `npm run verify`.
- New doc: `docs/` and a line in `docs/README.md`. Technical reference belongs in `docs/`; plain-
  language how-to guides belong in `wiki/` (follow `wiki/Writing-Wiki-Pages.md`). When behavior a
  wiki page describes changes, update the page in the same change.

## Naming

- Files: `camelCase.ts` for modules, `PascalCase.tsx` for React components, `kebab-case` for data
  files, fixtures, and docs.
- Reason codes: `SCREAMING_SNAKE`. Program-specific codes are prefixed by concern (`SNAP_`,
  `MEDICAID_`, `WIC_`, `STATUS_`, `RESULT_`, `DATA_`); cross-program factor codes such as
  `GROSS_INCOME_WITHIN_LIMIT` stay unprefixed. Check `packages/shared/src/reason-codes.ts` for an
  existing code before adding one.
- Money fields end in `Cents`; FPL percentages end in `Pct`.
