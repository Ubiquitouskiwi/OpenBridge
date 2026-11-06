# How the rules engine works

This page explains how OpenBridge turns a household's answers into a result for each program. It
is for contributors who will read or change the engine code or the rule data. The engine is the
riskiest part of the project: a wrong answer here can cost a family food or health coverage.

The source of truth is the code in
[`packages/eligibility-engine/src`]({{repo}}/tree/HEAD/packages/eligibility-engine/src) and the
standard in [`.kiro/steering/eligibility-rules.md`]({{repo}}/blob/HEAD/.kiro/steering/eligibility-rules.md).
This page is a map, not a copy.

## The pipeline at a glance

Everything starts in `evaluateEligibility()` in
[`engine.ts`]({{repo}}/blob/HEAD/packages/eligibility-engine/src/engine.ts). It takes four inputs
and returns one result per program:

- the household profile (who lives there, income, costs, flags such as `receivesSnap`);
- the state adapter (the state's rule values, see [[State adapters|State-Adapters]]);
- the federal data (poverty line tables and SNAP values from `data/federal/`);
- the evaluation date, as a `YYYY-MM-DD` string.

Then it runs these steps:

1. **Normalize.** `normalizeProfile()` works out the total gross monthly income from every income
   source, picks the poverty-line region from the state code (`contiguous`, `alaska`, or
   `hawaii`), and assumes the person lives in the state unless told otherwise.
2. **Pick the programs.** By default: `snap`, `medicaid`, `wic`, `liheap`, `tanf`. A program with
   no evaluator, or one the adapter does not configure, returns `unknown` with the reason
   `PROGRAM_NOT_YET_SUPPORTED`. It is never left out.
3. **Run each evaluator on its own.** Each program has one file in
   [`programs/`]({{repo}}/tree/HEAD/packages/eligibility-engine/src/programs). Evaluators never
   read each other's output. "Already gets SNAP" style shortcuts come only from what the person
   says they already receive.
4. **Work out the household and poverty line per program.** Programs count a household
   differently. [`household.ts`]({{repo}}/blob/HEAD/packages/eligibility-engine/src/household.ts)
   builds the SNAP household and each person's Medicaid (MAGI) household. A pregnant person counts
   as 1 plus the expected number of babies for Medicaid and WIC, but not for SNAP. The poverty line
   (FPL) is the base for one person plus a fixed amount per extra person
   ([`fpl.ts`]({{repo}}/blob/HEAD/packages/eligibility-engine/src/fpl.ts)).
5. **Downgrade for missing input.** If the household has no members or no state, or an hourly job
   has no hours per week, results become `possibly_eligible` with `MISSING_REQUIRED_INPUT`.
6. **Flag stale data.** If the evaluation date is past the FPL or SNAP `expectedRefreshDate`, or
   the adapter's `lastVerified` is more than 365 days old, every result gets
   `DATA_MAY_BE_OUT_OF_DATE` first. See [[Yearly data updates|Yearly-Data-Updates]].

Medicaid, CHIP, and WIC return a result for each person plus a rollup equal to the most
encouraging person's result (`mostEncouraging()`). SNAP, LIHEAP, and TANF return one result for the
household.

## The cautious outcome ladder

Every evaluator decides through `decideOutcome()` in
[`outcome.ts`]({{repo}}/blob/HEAD/packages/eligibility-engine/src/outcome.ts). Nobody hand-rolls an
outcome. The checks run in this order, and the first match wins:

| Order | Condition                                                                          | Outcome             |
| ----- | ---------------------------------------------------------------------------------- | ------------------- |
| 1     | A required input is missing, a factor cannot be computed, or within 10% of a limit | `possibly_eligible` |
| 2     | A hard disqualifier applies and no pathway remains                                 | `ineligible`        |
| 3     | Passes every hard test, but relies on what the person told us                      | `likely_eligible`   |
| 4     | Passes every hard test with verified inputs                                        | `eligible`          |
| 5     | Anything else                                                                      | `unknown`           |

The 10% margin is `NEAR_THRESHOLD_MARGIN_PCT`. Each evaluator decides when it applies: Medicaid
and LIHEAP flag income within 10% on either side of the limit, while SNAP flags it only when income
is just over a limit. Because uncertainty is checked before a hard "no",
a person close to a limit is never told they do not qualify. Immigration status alone never leads
to `ineligible`. Changing this ladder needs maintainer approval and an ADR (see
[`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md) section 5).

## Reason codes and calculation steps

The engine never writes English. It returns codes, and the web app turns them into words.

- **Reason codes** (`{ code, params }`) explain each result. Keys live in
  [`reason-codes.ts`]({{repo}}/blob/HEAD/packages/shared/src/reason-codes.ts). Params are raw
  values such as cents or counts, never formatted text. Every key needs an English string in
  [`reasons.json`]({{repo}}/blob/HEAD/packages/web-app/src/i18n/locales/en/reasons.json);
  `npm run check:reason-keys` enforces this.
- **Factor rows** show each test: a label code, the value, the limit, and pass or fail.
- **Calculation steps** are the "Show the math" trace. Each step has a label code from
  [`calculation-steps.ts`]({{repo}}/blob/HEAD/packages/shared/src/calculation-steps.ts), a value, a
  unit (`cents`, `pct`, or `count`), and an operation (`input`, `rule`, `limit`, `subtract`,
  `result`). A `rule` step points at the `sources[]` field it came from, so the app can link the
  official source or say "Source not listed yet". The trace holds the exact numbers the evaluator
  compared, so it cannot drift from the decision.

## Why purity matters

The engine has no network, no storage, no DOM, no i18n, no clock reads, and no randomness. The
date and all rule data are passed in. That gives three things:

- **Same input, same output.** Golden test cases can pin exact answers forever. See
  [[Golden test cases|Golden-Test-Cases]].
- **Privacy.** Code that cannot do I/O cannot leak a household's details.
- **Reuse.** The same engine runs in the browser, in the single-file offline download, and in the
  MCP server.

## A worked example

A made-up household in Washington: one adult, age 30, earning $1,000 a month in wages, checked on
2024-06-01 with the current draft adapter and the 2024 federal data.

SNAP (Washington uses broad-based categorical eligibility, so only the gross test applies):

1. Household size: 1. Annual FPL: $15,060, so monthly FPL is $1,255.00.
2. Gross limit: 200% of FPL, from `snap.grossIncomeLimitPct`. That is $2,510.00 a month.
3. $1,000 is under $2,510, so the gross test passes. The net income and asset tests are waived.
4. Income is self-reported, so the ladder gives `likely_eligible`.
5. Benefit estimate: earned income deduction 20% ($200) and standard deduction ($198) leave net
   income of $602. 30% of that is $180.60. The maximum allotment for one person is $291, so the
   estimate is $291.00 minus $180.60, which is $110.40 (`estimatedBenefitCents: 11040`).

Reasons returned: `SNAP_ESTIMATED_BENEFIT`, `GROSS_INCOME_WITHIN_LIMIT`, and
`SNAP_ABAWD_TIME_LIMIT_MAY_APPLY` (an adult with no children and no employment status given; it is
a notice, never a "no"). Under broad-based categorical eligibility the trace shows the gross test
and the benefit steps, not the net-income breakdown.

Medicaid for the same person: annual income of $12,000 is about 80% of FPL, under the 138% adult
limit, so the result is `likely_eligible`.

These numbers were checked by running the engine with these inputs. To pin them in a test, write a
fixture with `"expectedBenefits": { "snap": 11040 }`. The engine's own tests run with:

```bash
npm test -w @openbridge/eligibility-engine
```

## Related pages

- [[State adapters|State-Adapters]]
- [[Golden test cases|Golden-Test-Cases]]
- [[Understanding your results|Understanding-Your-Results]]
- [[Architecture|Architecture]]
