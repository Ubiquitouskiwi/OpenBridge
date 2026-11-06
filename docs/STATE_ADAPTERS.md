# State Adapters

A state adapter is a versioned JSON file that supplies a state's program rules to the eligibility
engine. New states are added as config + fixtures, with **no engine code changes** (requirements 5.10,
5.14, Q28).

## Location

```
data/states/<code>/adapter.json      # the StateAdapter
data/states/<code>/fixtures/*.json   # golden test cases
data/federal/*.json                  # shared federal reference data (FPL, SNAP)
```

## Adapter shape

See the `StateAdapter` type in `packages/shared/src/types.ts`. Key fields:

- `programs.snap`: `bbce`, `grossIncomeLimitPct`, `netIncomeLimitPct` (null under BBCE),
  `assetLimitCents` / `assetLimitElderlyDisabledCents` (null under BBCE), `hasVehicleAssetTest`.
- `programs.medicaid`: `expansion`, `adultLimitPct`, `parentCaretakerLimitPct`, `pregnantLimitPct`,
  `childTiers` (age-banded `limitPct`). MAGI pathways only in Phase 1.
- `programs.wic` / `liheap` / `tanf`: income limits and categorical flags.
- `portalUrls`: official application links per program.
- `sources`: **provenance** for required values (see below).
- `verificationStatus`: `draft` or `verified`.
- `lastVerified` / `lastVerifiedBy`: SME sign-off record.

Money is integer **cents**; percentages use the `...Pct` suffix and are percentages of the FPL.

## Required provenance (Q28)

Every program configured in an adapter must have at least one matching source in `sources[]`
(for example a `snap.*` field for SNAP), each with
`field`, `sourceName`, `url`, and `publishedDate`. `scripts/validate-state-adapter.ts` enforces this
in CI. Cite authoritative sources: HHS (FPL), USDA FNS (SNAP), and the state Medicaid agency /
Medicaid.gov.

## Golden fixtures (Q21)

Each fixture is a `profile → expected outcome per program` case:

```json
{
  "name": "…",
  "profile": { "members": [ … ], "incomeSources": [ … ], "county": "…", "stateCode": "XX" },
  "expected": { "snap": "likely_eligible", "medicaid": "…" },
  "expectedMembers": { "medicaid": { "kidId": "likely_eligible" } }
}
```

Include edge cases: threshold boundaries, categorical eligibility, elderly/disabled, mixed-status,
and the kids-eligible/parents-not scenario in non-expansion states. `npm run test:fixtures` runs
them; CI fails on any divergence.

## Verification workflow

1. Author the adapter with provenance and fixtures (`verificationStatus: "draft"`).
2. A subject-matter expert reviews the rule values, provenance, and fixtures.
3. On sign-off, record it in `docs/SME_SIGNOFF.md`, then set `verificationStatus: "verified"` and
   record `lastVerifiedBy` / `lastVerified`. Only a human SME's sign-off allows this step.
4. Adapters left as `draft` show a "these rules are drafts" note in Show the math. (A results-page
   banner exists in the locale files but is not shown yet; see `ROADMAP.md`.)

## Reference-data refresh

Federal values change on a schedule (requirements 5.15, Q29):

- **January**: HHS Federal Poverty Guidelines.
- **October**: USDA SNAP allotments/deductions (federal fiscal year).

Update the constants in `scripts/seed-fpl-data.ts`, run `npm run seed:fpl` (results report `dataVersion` as the poverty-guideline year),
re-verify with SMEs, and re-run fixtures.
