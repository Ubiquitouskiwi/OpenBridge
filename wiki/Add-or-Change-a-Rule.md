# Add or change a rule

This page walks you through changing a rule value in a state adapter, such as an income limit,
with a cited source and a test case. It is for contributors who are comfortable editing JSON and
running a few commands. If you would rather not touch code, use [[Report a rule problem|Report-a-Rule-Problem]]
instead, and a maintainer will make the change.

> Never invent a number. Every value must come from an official source you actually read. If you
> cannot find one, leave the value as it is and say so in an issue.

## Before you start

- The code set up on your computer. See [[Developer setup|Developer-Setup]].
- The official source for the value: a web page or document from the agency, with its publication
  or effective date.
- A short read of [`.kiro/steering/eligibility-rules.md`]({{repo}}/blob/HEAD/.kiro/steering/eligibility-rules.md).

## Steps

1. **Find the official source.** Prefer primary sources: HHS for the poverty line, USDA FNS for
   SNAP, and the state agency or Medicaid.gov for Medicaid. Note the URL and the date it was
   published.
2. **Open an issue first** if there is not one already. Use the "Eligibility rule correction"
   template. Changing a rule value needs a maintainer's explicit yes before it merges
   ([`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md) section 5).
3. **Make a branch**, for example `data/oh-wic-limit`.
4. **Edit the value** in `data/states/<code>/adapter.json` (for example
   `data/states/oh/adapter.json`). Keep the units: money in whole cents (`...Cents`), and
   percentages of the poverty line as whole numbers (`...Pct`, so `185` means 185%). See
   [[State adapters|State-Adapters]] for what each field means.
5. **Add or update the `sources[]` entry** for that field: `field` (the path, like
   `wic.incomeLimitPct`), `sourceName`, `url`, `publishedDate` (`YYYY-MM-DD`), and an optional
   `note`.

   If an expert sent a proposal file from the [[community rule toolkit|Community-Rule-Toolkit]],
   steps 4 and 5 are one command. It checks the proposal against today's values, sets each value,
   records the citation, and keeps the state `draft`:

   ```bash
   npm run rules:apply -- path/to/proposal.json --dry-run   # preview
   npm run rules:apply -- path/to/proposal.json             # apply
   ```

6. **Leave `verificationStatus` as `draft`.** Only a human expert sets `verified`, after a
   sign-off in [`docs/SME_SIGNOFF.md`]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md).
7. **Add or update a golden test case** in `data/states/<code>/fixtures/` that shows the change:
   for a limit change, a household just under and just over the new limit. See
   [[Golden test cases|Golden-Test-Cases]].
8. **Run the checks** from the repository root:

   ```bash
   npm run validate:adapters
   npm run test:fixtures
   ```

   If an existing test case now fails, do not change its expected result just to make it pass.
   Work out whether the rule or the test case is wrong, explain it in your pull request, and get
   a maintainer to agree.

9. **Run the full gate** before you open the pull request:

   ```bash
   npm run verify
   ```

10. **Add a line to `CHANGELOG.md`** under `## [Unreleased]`, in a `Data` group.
11. **Commit** with a `data` type, for example `data(oh): update WIC income limit`. If an AI agent
    wrote or drafted it, add an `Assisted-by: <agent or model>` trailer.
12. **Open a pull request** using the template. Tick "Eligibility rule or reference data", paste
    the source link, and paste the commands you ran with their results.

## What needs maintainer approval

From [`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md) section 5, propose these and wait for a yes:

- changing any rule value or threshold, or the outcome ladder in `decideOutcome()`;
- deleting data, test cases, or tests;
- adding a runtime dependency.

Every pull request is reviewed by a human maintainer before it merges.

## Changing how a rule works, not just its value

If the rule needs new logic (a new deduction, a new kind of test), that is an engine change in
[`packages/eligibility-engine/src/programs`]({{repo}}/tree/HEAD/packages/eligibility-engine/src/programs),
not a data change. Write the failing test first, keep the engine pure, decide through
`decideOutcome()`, and give any new reason code an English string. Read
[[How the rules engine works|How-the-Rules-Engine-Works]] before you start.

## Related pages

- [[State adapters|State-Adapters]]
- [[Golden test cases|Golden-Test-Cases]]
- [[Report a rule problem|Report-a-Rule-Problem]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
