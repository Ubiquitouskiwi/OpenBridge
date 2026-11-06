# Review rules as an expert

This page walks you through checking one state's rules if you know SNAP, Medicaid, WIC, LIHEAP, or
TANF well: caseworkers, agency staff, legal aid staff, and policy researchers. You do not need to
write code. Expert review is the most important step before OpenBridge can be used by the public.

> **Where things stand.** All three states (Ohio, Texas, Washington) are `draft`. No expert has
> signed off on any of them. The current numbers are 2024 figures entered by the engineering team
> for testing, and they must be checked against current agency data.

## What you check

A "state adapter" is the file that holds one state's rule numbers (see the [[Glossary]]). For each
state, you check four things (from the [sign-off record]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md)):

1. Income limits, benefit amounts, and Medicaid expansion settings match official sources.
2. The cited sources are current and correct.
3. The test cases (called "golden fixtures") expect the results a real caseworker would expect,
   including edge cases.
4. The year of the reference data is the right one to use.

## Before you start

- Tell us which state and programs you plan to review, by email (openbridge@starlingtek.com) or on
  a "New state request or offer" issue (choose "I can review rules as a subject-matter expert").
- Have the official sources ready: the state's policy manuals and income tables, plus federal ones
  (HHS poverty guidelines, USDA FNS for SNAP and WIC, and Medicaid.gov).

## Steps

1. **Open the state's rule file.** On GitHub, open [data/states]({{repo}}/tree/HEAD/data/states),
   then the state's folder (`oh`, `tx`, or `wa`), then `adapter.json`. Shared federal numbers are
   in [data/federal]({{repo}}/tree/HEAD/data/federal).
2. **Read the numbers.** Names ending in `Pct` are a percent of the federal poverty line, so
   `"adultLimitPct": 138` means 138% of the poverty line. Names ending in `Cents` are money in
   cents, so `60000` means $600. A value of `null` means the test does not apply.
3. **Compare each value with its source.** The `sources` list near the end of the file names the
   official source for each value, with a link and a published date. Open the link, find the
   number, and check that it matches and that the date is current. If a value has no entry in
   `sources`, note that too.
4. **Spot-check with Show the math.** In the app, screen a made-up household in your state. On the
   results page, select a program's name to open its details, then open **Show the math**. The
   table lists each step, the amount, and "Where it comes from". Check the math by hand. A row that
   says "Source not listed yet" is a value with no citation.
5. **Try the edges.** Screen households right at a limit, just under it, and just over it. Try an
   older or disabled member, a pregnant member, and children with parents in the same household.
6. **Check the test cases.** Open the state's `fixtures` folder. Each file is a made-up household
   and the results it should get. Ask: would a caseworker expect these results?
7. **Record what you find.** For each wrong or outdated value, open one
   [[rule correction issue|Report-a-Rule-Problem]]. For a missing scenario,
   [[record a test case|Record-a-Test-Case]]. Send a short summary of your review by email or as a
   comment on your review issue.

## How sign-off works

When you are satisfied that the rules, sources, and test cases are right, tell the maintainers you
approve. A maintainer then adds your review to the
[sign-off record]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md) (reviewer, affiliation, data version,
date, and outcome), and only after that entry is marked Approved can the state be set to
`verified`. Until then, the app shows a note that the state's rules are still being reviewed.

Only a human subject-matter expert can approve a state. Maintainers, other contributors, and AI
tools cannot mark a state verified on their own. Rules also need a new review whenever the yearly
federal numbers change (see [[Yearly data updates|Yearly-Data-Updates]]).

## Quick checklist

- [ ] Every income limit and amount matches a current official source.
- [ ] Every source link works and its published date is correct.
- [ ] Values with no source are listed in your notes.
- [ ] Show the math agrees with your hand calculation for at least three households.
- [ ] Households at, just under, and just over a limit get sensible results.
- [ ] Each test case expects the result a caseworker would expect.
- [ ] Each problem has its own rule correction issue.
- [ ] You told the maintainers whether you approve.

## Related pages

- [[Report a rule problem|Report-a-Rule-Problem]]
- [[Record a test case|Record-a-Test-Case]]
- [[State adapters|State-Adapters]]
- [[Understanding your results|Understanding-Your-Results]]
