---
inclusion: fileMatch
fileMatchPattern: ['packages/eligibility-engine/**', 'packages/shared/**', 'data/**', 'scripts/**']
---

# Eligibility rules and data standards

The highest-risk code in the project. A wrong answer here harms a real family. Read
`.kiro/specs/openbridge/requirements.md` sections 5.1, 5.2, 7, and 7.1 before changing behavior.

## Engine invariants (enforced by review and tests)

1. **Purity.** No imports of DOM, network, storage, i18n, `Date.now()`, or `Math.random()`. The
   evaluation date and all reference data are function arguments.
2. **Totality.** Every requested program returns exactly one result. Unsupported programs return
   `unknown` with a "not yet supported" reason; they are never omitted.
3. **Program independence.** Evaluators never read another evaluator's output. Adjunctive or
   categorical eligibility comes only from actual-receipt flags (`receivesSnap`, `receivesMedicaid`,
   `receivesCashAssistance`).
4. **Per-member scope.** Medicaid, CHIP, and WIC return a result per relevant member plus a rollup
   equal to the most encouraging member outcome (`mostEncouraging()`). SNAP, LIHEAP, and TANF are
   household-scoped.
5. **Per-program FPL.** Each program computes its own household size and FPL; pregnancy counts as
   2 or more where the program says so.

## The outcome ladder

All evaluators decide through `decideOutcome()` in `packages/eligibility-engine/src/outcome.ts`.
Never hand-roll an outcome. The order is fixed:

1. Uncomputable factor, missing required input, or within 10% of a threshold: `possibly_eligible`.
2. Hard disqualifier and no plausible pathway: `ineligible`.
3. Passes, but relies on self-reported data: `likely_eligible`.
4. Passes with verified inputs: `eligible` (rare client-side).
5. Otherwise: `unknown`.

Immigration or eligibility status alone never produces `ineligible`. Children and pregnant members
are evaluated on status-blind rules. Status-complex cases add a `STATUS_NEEDS_HUMAN_REVIEW`-style
reason that routes to referrals. Changing this ladder requires maintainer approval and an ADR.

## Reason codes

- Every outcome carries reason codes (`{ code, params }`) and factor rows (`labelCode`, `value`,
  `threshold`, `passes`). A result with no explanation is a bug.
- Keys live in `packages/shared/src/reason-codes.ts`; reuse before adding.
- A new key needs an English string in `web-app/src/i18n/locales/en/reasons.json` (CI-enforced by
  `npm run check:reason-keys`) and should get a Spanish string in the same change when possible.
- Params are typed values (cents, percentages, counts), never preformatted English.

## Rule values and provenance

- Rule values live only in `data/` (state adapters and federal tables), never in engine code.
- Every required value has a `sources[]` entry: `field`, `sourceName`, `url`, `publishedDate`, and
  an optional `note`. Prefer primary sources: HHS (poverty guidelines), USDA FNS (SNAP), the state
  Medicaid agency or Medicaid.gov, the state WIC/LIHEAP/TANF agency.
- **Agents never invent or "update" a number without a source they actually read.** If a value
  looks wrong or stale, open an issue or report it with the evidence; do not guess a replacement.
- Units: money in integer cents (`...Cents`), FPL percentages as whole numbers (`...Pct`, e.g.
  `130` means 130% FPL).
- `verificationStatus` stays `draft` until a human SME signs off in `docs/SME_SIGNOFF.md`.
- `dataVersion` is bumped whenever any reference value changes. Federal values refresh every
  January (FPL) and October (SNAP); follow the process in `docs/STATE_ADAPTERS.md`.

## Golden fixtures

- Location: `data/states/<code>/fixtures/<kebab-case-scenario>.json`, shape
  `{ name, profile, expected, expectedMembers? }`.
- Every behavior change to an evaluator or adapter adds or updates at least one fixture.
- Each state keeps fixtures covering: a clear pass, a clear fail, a threshold boundary (just under
  and just over), a near-threshold `possibly_eligible`, categorical/adjunctive eligibility, an
  elderly or disabled household, a mixed-status household, and (for non-expansion states) children
  eligible while parents are not.
- Use obviously synthetic data (ids like `self`, `kid1`; round amounts). Never real cases.
- Do not edit an `expected` value to make a fixture pass. If the engine and fixture disagree,
  decide which one is wrong, explain why in the PR, and get maintainer agreement.

## Adding a state

1. Copy the closest existing adapter as a starting point (expansion vs. non-expansion, BBCE vs. not).
2. Replace every value from a cited source. Leave `verificationStatus: "draft"`.
3. Add the fixture set above.
4. Register the adapter in `packages/web-app/src/data/index.ts` so the app can load it (the MCP
   server and scripts read `data/states/` directly).
5. Run `npm run validate:adapters && npm run test:fixtures`.
6. Add a pending row in `docs/SME_SIGNOFF.md` and a line in `CHANGELOG.md`.
