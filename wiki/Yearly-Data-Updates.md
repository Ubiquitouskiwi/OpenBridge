# Yearly data updates

Some rule values change on a fixed calendar. This page explains the two yearly refreshes, how to
do them, and what the app does when data gets old. It is for maintainers and contributors who
update reference data.

The process is defined in [`docs/STATE_ADAPTERS.md`]({{repo}}/blob/HEAD/docs/STATE_ADAPTERS.md)
("Reference-data refresh"). The values come from
[`scripts/seed-fpl-data.ts`]({{repo}}/blob/HEAD/scripts/seed-fpl-data.ts).

> The values in the repository today are illustrative 2024 and FY2024 figures, pending expert
> review. Do not copy them anywhere as real limits.

## The two refreshes

| When    | What changes                                                                                                       | Source                 | Files                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------- |
| January | Federal poverty guidelines (FPL), for the contiguous states, Alaska, and Hawaii                                    | HHS poverty guidelines | `data/federal/poverty-guidelines.*.json` |
| October | SNAP maximum allotments, standard deductions, shelter cap, and other federal SNAP values (new federal fiscal year) | USDA FNS               | `data/federal/snap.json`                 |

State adapters can also change at any time. Those follow
[[Add or change a rule|Add-or-Change-a-Rule]].

## Steps

1. **Read the new official figures.** HHS publishes the poverty guidelines each January; USDA FNS
   publishes SNAP cost-of-living adjustments for the fiscal year that starts in October.
2. **Open an issue** and note the source links and publication dates. Changing reference values
   needs maintainer approval.
3. **Update the constants** in `scripts/seed-fpl-data.ts`:
   - January: `fplTables`, `FPL_YEAR`, `FPL_EFFECTIVE`, and `FPL_REFRESH` (the date the data
     should next be refreshed).
   - October: the `snap` object, including its `effectiveDate` and `expectedRefreshDate`.
4. **Regenerate the files:**

   ```bash
   npm run seed:fpl
   ```

5. **Check the generated files** with `git diff` before going further. Make sure every field that
   was in `data/federal/snap.json` is still there. (The seed script does not write `abawdMinAge`,
   `abawdMaxAge`, or `elderlyAge`, and the validator requires them. Keep them in the file.)
6. **Update the sources** in `data/federal/sources.json`: the `sourceName`, `url`,
   `publishedDate`, and `note` for each refreshed value. The seed script does not touch this file.
7. **Check `dataVersion`.** Today `dataVersion` is the FPL `year`, so changing `FPL_YEAR` in
   January changes it. An October SNAP-only update does not change it; say so in your pull
   request so a maintainer can decide how to label the data.
8. **Run the checks:**

   ```bash
   npm run validate:adapters
   npm run test:fixtures
   npm run verify
   ```

   Some benefit-amount test cases will change with new SNAP values. Do not just copy the new
   numbers into `expectedBenefits`: check them against the official tables, explain each change,
   and get a maintainer to agree.

9. **Ask for re-verification.** Experts need to review the new values. Record the review in
   [`docs/SME_SIGNOFF.md`]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md). Adapters stay `draft` until a
   human expert signs off.
10. **Add a `Data` entry** to `CHANGELOG.md` under `## [Unreleased]`, and open the pull request.
    A release that only changes reference data bumps the patch version
    ([[Making a release|Making-a-Release]]).

## What the app does when data is old

The engine adds the reason `DATA_MAY_BE_OUT_OF_DATE` to the top of every result when any of these
is true on the screening date:

- the FPL table's `expectedRefreshDate` has passed;
- the SNAP data's `expectedRefreshDate` has passed;
- the state adapter's `lastVerified` date is more than 365 days old.

People see: "These figures may be out of date. Please double-check with the agency." Because the
repository's data is from 2024, this notice shows on screenings today.

When someone opens a saved screening at `/resume` and the save file's `dataVersion` is different
from the app's, the app warns: "The rules changed since you saved. Please re-check your results."

## Related pages

- [[State adapters|State-Adapters]]
- [[Golden test cases|Golden-Test-Cases]]
- [[Making a release|Making-a-Release]]
- [[Roadmap and status|Roadmap-and-Status]]
