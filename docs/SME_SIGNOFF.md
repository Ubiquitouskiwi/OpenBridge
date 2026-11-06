# SME Sign-off Record

State adapters ship as `draft` until a subject-matter expert verifies their rule values, provenance,
and golden fixtures (requirement 5.14.3, Q21). This file records those sign-offs. An adapter may only
be set to `verificationStatus: "verified"` after an entry here is marked **Approved**.

## What the SME verifies

- Income limits, allotments, and expansion thresholds match the cited authoritative sources.
- Provenance `sources[]` are current and correct.
- Golden fixtures reflect real-world expected outcomes (including edge cases).
- The current reference-data year (`dataVersion`) is appropriate.

## Records

| State  | Reviewer  | Affiliation                                  | dataVersion | Date | Outcome |
| ------ | --------- | -------------------------------------------- | ----------- | ---- | ------- |
| **OH** | _pending_ | Franklin County (social work + epidemiology) | 2024        | none | Pending |
| TX     | _pending_ | none                                         | 2024        | none | Pending |
| WA     | _pending_ | none                                         | 2024        | none | Pending |

> The Ohio adapter (`data/states/oh/adapter.json`) currently has
> `lastVerifiedBy: "pending-franklin-county-sme"`. Once the Franklin County reviewers approve,
> update that field to the reviewer's name, set `verificationStatus: "verified"`, and mark this
> record **Approved**.

## Notes

All Phase 1 values are illustrative 2024/FY2024 figures entered by engineering. They MUST be
verified against current agency data before any public use.
