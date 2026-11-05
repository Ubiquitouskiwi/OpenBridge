---
inclusion: always
---

# Engineering standards

Applies to all TypeScript in this repo. Formatting is owned by Prettier (`npm run format`); do not
hand-format against it. Lint is owned by ESLint; fix warnings rather than disabling them.

## Code

- **Types are the contract.** No `any`. Use `unknown` plus narrowing at boundaries. The one existing
  exception (`form-assembly/src/renderPdf.ts`, a library typing gap) is scoped and commented; new
  exceptions need the same: smallest scope, an `eslint-disable-next-line` with a reason.
- **Explicit public signatures.** Exported functions declare parameter and return types.
- **Pure where possible.** Logic in `shared` and `eligibility-engine` is side-effect free. Put I/O,
  storage, and browser APIs at the edges (`web-app/src/lib`, stores, scripts).
- **Total functions.** The engine never throws on user data. Represent "can't tell" as an outcome
  (`possibly_eligible` / `unknown`) with a reason code, not as an exception.
- **Validate at boundaries.** Use Zod for anything coming from a user, a file, or a JSON data file.
  Trust types internally after validation.
- **Money is integer cents** via `packages/shared/src/money.ts`. Never `parseFloat` a dollar amount
  into a comparison.
- **No magic numbers.** Eligibility values live in `data/` with provenance. Other constants get a
  named `const` with a comment saying where the value comes from.
- **Small units.** Prefer functions under about 50 lines and files under about 300. Split by concern
  when they grow.
- **Comments explain why.** Reference the requirement or decision when it drives a choice, e.g.
  `// Q17: status alone never disqualifies.` Do not narrate what the code obviously does.
- **Imports:** external packages first, then workspace packages (`@openbridge/*`), then relative
  imports. Use `import type` for type-only imports (`verbatimModuleSyntax` is on).
- **Errors in the UI** surface as friendly, localized messages. Never show a stack trace or raw
  error text to a user, and never log personal data (see `privacy-security.md`).

## React

- Function components and hooks only. One component per file for anything exported.
- Feature logic lives in `features/<name>/`; route files stay thin.
- Read and write state through the Zustand stores; no ad hoc module-level mutable state.
- Every interactive element is a real semantic element (`button`, `a`, `input` with `label`).
- No inline user-facing strings: all copy goes through i18next (`t('...')`).

## Data files (`data/`)

- JSON, two-space indent, Prettier-formatted, keys in camelCase.
- Every rule value has a matching `sources[]` entry (see `eligibility-rules.md`).
- Changing a data file requires running `npm run validate:adapters` and `npm run test:fixtures`.

## Definition of done (every change)

- [ ] Serves a stated requirement or issue; scope is one concern.
- [ ] Tests added or updated, and they fail without the change.
- [ ] `npm run verify` passes locally (and `npm run e2e` for UI changes).
- [ ] No new `any`, disabled lint rules, skipped tests, or TODOs without an issue link.
- [ ] Docs, steering, and `CHANGELOG.md` (`Unreleased`) updated where behavior changed.
- [ ] No personal data in logs, fixtures, screenshots, or examples (use obviously fake values).
