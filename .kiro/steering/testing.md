---
inclusion: always
---

# Testing standards

## Layers

| Layer              | Tool                      | Location                            | Runs in                     |
| ------------------ | ------------------------- | ----------------------------------- | --------------------------- |
| Unit               | Vitest                    | colocated `*.test.ts(x)`            | `npm test`                  |
| Golden fixtures    | `scripts/run-fixtures.ts` | `data/states/<code>/fixtures/`      | `npm run test:fixtures`     |
| Adapter validation | Zod + provenance          | `scripts/validate-state-adapter.ts` | `npm run validate:adapters` |
| Copy checks        | reason keys, readability  | `scripts/`                          | `npm run verify`            |
| End-to-end + a11y  | Playwright + axe          | `packages/web-app/e2e/`             | `npm run e2e`               |

## Rules

- **Behavior changes ship with tests.** Bug fixes start with a test that reproduces the bug.
- **Engine logic is tested at boundaries:** just under, at, and just over every threshold, the 10%
  near-threshold band, missing inputs, and each branch of `decideOutcome()`.
- **Tests are deterministic.** Pass dates explicitly; no wall-clock, network, or randomness.
- **Test behavior, not implementation.** Assert outcomes, reason codes, and rendered text, not
  private helpers or internal call counts.
- **Synthetic data only.** No real names, addresses, or cases anywhere in tests or fixtures.
- **Never weaken a test to pass.** Do not delete, skip (`.skip`, `.only`), loosen assertions, or edit
  expected fixture outcomes to get green. If a test is wrong, fix it in its own change and explain.
- **UI changes** add or update a Playwright spec when they change a user flow, and keep the axe
  checks passing.
- **Privacy has tests.** Anything that holds personal data must be covered by the clear-data test,
  and save/export changes need encrypt/decrypt round-trip and wrong-passphrase tests.

## Reporting

When reporting results, name the commands you ran and their pass counts. If a suite could not run
(missing browser, sandbox limits), say so explicitly rather than implying it passed.
