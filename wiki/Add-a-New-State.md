# Add a new state

This page walks you through adding a state to OpenBridge: a new adapter file, its test cases, and
the records that go with it. It is for contributors who can edit JSON and run commands, ideally
working with someone who knows that state's benefit rules.

The checklist here comes from "Adding a state" in
[`.kiro/steering/eligibility-rules.md`]({{repo}}/blob/HEAD/.kiro/steering/eligibility-rules.md) and
from [`docs/STATE_ADAPTERS.md`]({{repo}}/blob/HEAD/docs/STATE_ADAPTERS.md). If they change, they
win.

> A new state ships as `draft`. It is not "done" until a subject-matter expert signs off, and
> nobody but that expert marks it verified.

## Before you start

- Open a "New state request or offer" issue so others know you are working on it.
- Gather the official sources for every value: SNAP limits and whether the state uses broad-based
  categorical eligibility (BBCE), Medicaid and CHIP limits by group and age, WIC, LIHEAP, and TANF
  limits, and each program's official application site.
- Set up the code. See [[Developer setup|Developer-Setup]].

## Steps

1. **Pick the closest existing adapter** and copy it to `data/states/<code>/adapter.json`, with a
   lowercase folder name (for example `data/states/pa/`):
   - Washington (`wa`): Medicaid expansion, SNAP BBCE at 200%.
   - Ohio (`oh`): Medicaid expansion, SNAP BBCE at 130%.
   - Texas (`tx`): no Medicaid expansion, no SNAP BBCE (net income and asset tests apply).
2. **Replace every value from a cited source.** Update `stateCode`, `stateName`,
   `medicaidExpansion`, each `programs` block, and `portalUrls`. Do not keep a copied number
   because it looks about right. If you cannot source a program, leave that program out rather
   than guess; the engine returns `unknown` for it.
3. **Write `sources[]`** with one entry per value: `field`, `sourceName`, `url`, `publishedDate`,
   and an optional `note`. The validator fails if any configured program has no source.
4. **Leave `verificationStatus: "draft"`** and set `lastVerifiedBy` to a `pending-...` value.
5. **Add the golden test cases** in `data/states/<code>/fixtures/`. Cover each of these:
   - a clear pass and a clear fail;
   - a threshold boundary, just under and just over;
   - a near-threshold `possibly_eligible`;
   - categorical or adjunctive eligibility (for example a household that already gets cash
     assistance);
   - an elderly or disabled household;
   - a mixed-status household;
   - for a state without Medicaid expansion, children eligible while parents are not.

   See [[Golden test cases|Golden-Test-Cases]] for the format. The `/review` page can draft them
   for you.

6. **Register the state in the web app.** The app bundles adapters by import, so add your adapter
   to the `adapters` list in
   [`packages/web-app/src/data/index.ts`]({{repo}}/blob/HEAD/packages/web-app/src/data/index.ts).
   The scripts and the MCP server find states by reading the `data/states/` folder.
7. **Run the checks:**

   ```bash
   npm run validate:adapters && npm run test:fixtures
   npm run verify
   ```

8. **Add a pending row** for the state in
   [`docs/SME_SIGNOFF.md`]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md), with the reviewer as
   `_pending_`.
9. **Add a line to `CHANGELOG.md`** under `## [Unreleased]`, for example in a `Data` group:
   "Draft adapter for Pennsylvania, pending expert review."
10. **Open a pull request** using the template, linking the issue and listing every source.

## What happens next

A maintainer reviews the pull request. A subject-matter expert then checks the values, sources,
and test cases. Only when they approve does the `SME_SIGNOFF.md` row become Approved and the
adapter become `verified`. Until then the app shows that the rules are drafts.

## Related pages

- [[State adapters|State-Adapters]]
- [[Golden test cases|Golden-Test-Cases]]
- [[Add or change a rule|Add-or-Change-a-Rule]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
