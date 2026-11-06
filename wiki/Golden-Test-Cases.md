# Golden test cases

A golden test case (a "fixture") is a made-up household plus the result experts expect for each
program. OpenBridge runs every one of them on every change, so a rule cannot quietly drift. This
page explains the format, where they live, and how to run and add them.

If you do not write code, you can still make one: see [[Record a test case|Record-a-Test-Case]].

## Where they live

```
data/states/<code>/fixtures/<kebab-case-scenario>.json
```

For example `data/states/oh/fixtures/family-with-children.json`. Use a short, plain file name that
describes the household.

## The format

Each file is one JSON object, checked by the schema in
[`scripts/lib/loaders.ts`]({{repo}}/blob/HEAD/scripts/lib/loaders.ts):

```json
{
  "name": "Washington single adult with low wages",
  "profile": {
    "members": [{ "id": "self", "relationship": "self", "age": 30 }],
    "incomeSources": [
      { "type": "wages", "amountCents": 100000, "frequency": "monthly", "earned": true }
    ],
    "county": "King",
    "stateCode": "WA"
  },
  "expected": { "snap": "likely_eligible", "medicaid": "likely_eligible" },
  "expectedMembers": { "medicaid": { "self": "likely_eligible" } },
  "expectedBenefits": { "snap": 11040 }
}
```

- `name`: a plain description of the household.
- `profile`: the household's answers, in the same shape as the `HouseholdProfile` type in
  [`packages/shared/src/types.ts`]({{repo}}/blob/HEAD/packages/shared/src/types.ts). You can leave
  out values the engine works out itself, such as total gross income.
- `expected`: the expected outcome per program: `eligible`, `likely_eligible`,
  `possibly_eligible`, `ineligible`, or `unknown`.
- `expectedMembers` (optional): expected outcomes per person, for programs that judge each person
  (Medicaid and CHIP, WIC).
- `expectedBenefits` (optional): an expected benefit estimate in whole cents.

Use obviously made-up data: ids like `self`, `spouse`, `kid1`, and round amounts. Never use a real
case, even with the name removed.

## The categories each state needs

Each state keeps test cases covering:

- a clear pass and a clear fail;
- a threshold boundary, just under and just over;
- a near-threshold `possibly_eligible`;
- categorical or adjunctive eligibility (for example, already receiving cash assistance);
- an elderly or disabled household;
- a mixed-status household;
- for states without Medicaid expansion, children eligible while parents are not.

Every change to an evaluator or an adapter adds or updates at least one test case.

## How to run them

From the repository root:

```bash
npm run test:fixtures      # every golden test case
npm run validate:adapters  # adapter checks, then the test cases again
```

Both run inside `npm run verify` and in CI. Every test case is evaluated as if today were
2024-06-01 (`FIXTURE_AS_OF` in
[`scripts/lib/fixtures.ts`]({{repo}}/blob/HEAD/scripts/lib/fixtures.ts)), so age-based results do
not change over time. A failure prints the state, the test case name, and what was expected
versus what the engine returned.

> Never edit an `expected` value just to make a test pass. If the engine and the test case
> disagree, work out which one is wrong, explain why in the pull request, and get a maintainer to
> agree.

## How the `/review` recorder makes them

The app's `/review` page turns a made-up screening into a test case file without any coding:

1. Screen a made-up household at `/screen`.
2. Open `/review`. Each program and person is pre-filled with what OpenBridge says now, worked
   out as of 2024-06-01 so it matches the test runner.
3. Change any result you think is wrong, give the test case a name, and confirm the household is
   made up.
4. Download the file. It has exactly the format above. A benefit estimate is kept only where you
   agreed with the engine's outcome.
5. Send it in: attach it to an "Eligibility rule correction" issue, or open a pull request that
   adds it to `data/states/<code>/fixtures/`.

The code is in
[`packages/web-app/src/features/review`]({{repo}}/tree/HEAD/packages/web-app/src/features/review).

## Related pages

- [[Record a test case|Record-a-Test-Case]]
- [[Add or change a rule|Add-or-Change-a-Rule]]
- [[Add a new state|Add-a-New-State]]
- [[How the rules engine works|How-the-Rules-Engine-Works]]
