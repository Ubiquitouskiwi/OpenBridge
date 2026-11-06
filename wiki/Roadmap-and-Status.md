# Roadmap and status

This page explains, in plain words, where OpenBridge is today and what has to happen before the
public can use it. The [ROADMAP]({{repo}}/blob/HEAD/ROADMAP.md) in the repository is the source of
truth. If this page and the roadmap disagree, the roadmap wins.

> **OpenBridge is not ready for public use.** The rules are drafts. No expert has signed off, legal
> review has not happened, and there is no live site. Results are estimates, not decisions.

## Where things stand today

Phase 1 is built as a prototype. The automated checks pass. What is missing is mostly human work.

| Area                    | Status                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| Programs                | SNAP, Medicaid and CHIP, WIC built; LIHEAP and TANF early                  |
| States                  | Ohio, Texas, Washington, all `draft` (not verified)                        |
| Languages               | English and Spanish                                                        |
| Reference figures       | From 2024; need a refresh                                                  |
| Golden test cases       | 8 in total across three states                                             |
| Expert review of rules  | Not started (no reviewers yet for any state; recruiting them is a blocker) |
| Legal review            | Not started (review package prepared)                                      |
| Testing with real users | Not started                                                                |
| Screen reader testing   | Not started (automated checks pass)                                        |
| Ohio prefill            | A list of the right fields, not the official form yet                      |
| Referral directory      | 5 entries                                                                  |
| Release downloads       | Built (local file, hosted bundle, container images)                        |
| Public site             | Not deployed                                                               |

Expert sign-off is tracked in [SME_SIGNOFF.md]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md) and legal
review in [LEGAL_REVIEW.md]({{repo}}/blob/HEAD/docs/LEGAL_REVIEW.md).

## The path to a public pilot

Items marked **BLOCKER** must be done before anything ships to the public.

### Getting the rules right

- **BLOCKER:** Experts review and sign off on the Ohio rules.
- **BLOCKER:** Find reviewers for Texas and Washington and finish their sign-off, or launch the
  pilot with those states clearly labeled unverified.
- **BLOCKER:** Update all reference figures to current federal poverty guidelines and SNAP figures,
  with sources.
- Add more [[golden test cases|Golden-Test-Cases]] for every kind of case in each state.
- Decide who owns the yearly updates in January (poverty guidelines) and October (SNAP).

### Legal and trust

- **BLOCKER:** Legal review of the Terms of Use, disclaimers, referral policy, privacy statements,
  and license.
- Decide contributor terms.
- Get an independent review of the privacy claims.

### Product quality

- **BLOCKER:** Usability sessions with benefit seekers and navigators, then revise the wording.
- **BLOCKER:** A hands-on accessibility pass with screen readers.
- Build the Ohio SNAP and Medicaid forms to match the current official forms.
- Grow the referral directory to county level in the pilot states.
- Have a qualified translator review the Spanish.

### Community tools and publishing

- The [[community rule toolkit|Community-Rule-Toolkit]] is available: review a state's rules,
  propose a change with a citation, and check test cases, all without code. Next: Spanish, and
  reviewing federal figures.
- This wiki.
- Publish the repository and deploy a pilot site for partner organizations.

## After the pilot

- **Phase 2:** full LIHEAP and TANF, about 10 states, more official forms, an organization
  dashboard, custom branding, navigator training, more languages.
- **Phase 3:** optional encrypted cloud sessions for organizations, staff accounts, Unemployment
  Insurance, a case-management connection, about 25 states, privacy-safe impact counts.
- **Phase 4:** national coverage for the core programs, 211 integration, and a long-term home.

## Known limits

Medicaid covers income-based (MAGI) pathways only. CHIP is approximated through Medicaid child
limits. WIC stops at "possibly eligible". SNAP work rules, vehicle value, and itemized
self-employment costs are not calculated. See the [[Glossary]] for these terms.

## Related pages

- [[One-Pager]]
- [[White paper|White-Paper]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
- [[Ways to help|Contribute-Without-Code]]
