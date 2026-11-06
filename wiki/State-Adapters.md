# State adapters

A state adapter is one JSON file that holds a state's rule values: income limits, program options,
and links to the official application sites. This page explains what is in it, in plain words, for
contributors who will read or edit one.

The technical reference is [`docs/STATE_ADAPTERS.md`]({{repo}}/blob/HEAD/docs/STATE_ADAPTERS.md).
The exact shape is the `StateAdapter` type in
[`packages/shared/src/types.ts`]({{repo}}/blob/HEAD/packages/shared/src/types.ts), and the file is
checked against a schema in
[`scripts/lib/loaders.ts`]({{repo}}/blob/HEAD/scripts/lib/loaders.ts).

> Every adapter today (Ohio, Texas, Washington) is `draft`. No expert has signed off on any of
> them. Their values are illustrative 2024 figures and must not be treated as verified.

## Where adapters live

```
data/states/<code>/adapter.json      the rules for one state (code is lowercase, like oh)
data/states/<code>/fixtures/*.json   golden test cases for that state
data/federal/*.json                  federal values shared by every state
```

Adding a state is data plus test cases. The engine code does not change.

## The fields, in plain words

| Field                | What it means                                                       |
| -------------------- | ------------------------------------------------------------------- |
| `stateCode`          | Two-letter code in capitals, like `OH`.                             |
| `stateName`          | The state's name as people see it.                                  |
| `medicaidExpansion`  | Whether the state expanded Medicaid to low-income adults.           |
| `programs`           | One block per program the state supports (see below).               |
| `portalUrls`         | The official place to apply, per program.                           |
| `sources`            | Where each rule value came from (see "Provenance").                 |
| `verificationStatus` | `draft` or `verified`. Only an expert sign-off makes it `verified`. |
| `lastVerified`       | The date of the last review, as `YYYY-MM-DD`.                       |
| `lastVerifiedBy`     | Who reviewed it. Today every adapter says `pending-...`.            |

The program blocks:

| Block               | Fields and meaning                                                                                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programs.snap`     | `bbce` (broad-based categorical eligibility: waives the net income and asset tests), `grossIncomeLimitPct`, `netIncomeLimitPct` (null under BBCE), `assetLimitCents` and `assetLimitElderlyDisabledCents` (null under BBCE), `hasVehicleAssetTest`. |
| `programs.medicaid` | `expansion`, `adultLimitPct`, `parentCaretakerLimitPct`, `pregnantLimitPct`, and `childTiers` (age bands, each with `maxAgeInclusive` and `limitPct`; CHIP is covered through these).                                                               |
| `programs.wic`      | `incomeLimitPct`.                                                                                                                                                                                                                                   |
| `programs.liheap`   | `incomeLimitPct`, and `categoricalIfSnap` (people who get SNAP qualify).                                                                                                                                                                            |
| `programs.tanf`     | `baseMonthlyLimitCents` and `perAdditionalPersonCents`.                                                                                                                                                                                             |

Units are strict:

- Money is whole cents. `65400` means $654.00. Field names end in `Cents`.
- Percentages are percent of the federal poverty line, as whole numbers. `138` means 138% of FPL.
  Field names end in `Pct`.

## Provenance: `sources[]`

Every rule value must say where it came from. Each entry in `sources[]` has:

- `field`: the path of the value it backs, like `snap.grossIncomeLimitPct`;
- `sourceName`: the agency or document, like "USDA FNS WIC Income Eligibility Guidelines";
- `url`: a link to the official source;
- `publishedDate`: when the source was published, as `YYYY-MM-DD` (not in the future);
- `note`: optional, for anything a reviewer should know.

Prefer primary sources: HHS for the poverty line, USDA FNS for SNAP, and the state agency or
Medicaid.gov for Medicaid. The "Show the math" view links each rule step to its matching `field`,
or says "Source not listed yet" when there is no entry.

`npm run validate:adapters` fails if any configured program has no source, or if a date is invalid
or in the future.

## `verificationStatus`

- `draft` means the values have not been checked by a subject-matter expert. The app shows the note
  "These rules are drafts. Experts are still checking them." in the "Show the math" view.
- `verified` can be set only by a human expert, after a sign-off is recorded in
  [`docs/SME_SIGNOFF.md`]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md). Agents and contributors never set
  it. The validator also refuses `verified` while `lastVerifiedBy` still starts with `pending`.

## `dataVersion`

`dataVersion` labels which set of reference data produced a result. Today it is the poverty-line
`year` from `data/federal/poverty-guidelines.contiguous.json` (for example `2024`). It is printed
on PDFs, stored in save files so a resumed screening can warn that rules changed, and written into
release `BUILD-INFO.json`. It is not a field inside `adapter.json`. See
[[Yearly data updates|Yearly-Data-Updates]].

## Related pages

- [[How the rules engine works|How-the-Rules-Engine-Works]]
- [[Add or change a rule|Add-or-Change-a-Rule]]
- [[Add a new state|Add-a-New-State]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
