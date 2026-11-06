# White paper

The OpenBridge white paper explains the problem, how OpenBridge works, where it falls short today,
and what it will take to launch. This page summarizes each section and lists every version.

> The white paper describes a prototype. Its figures come from draft reference data and must be
> checked against current agency sources before public use.

## Versions

| Version | Date          | Download                                                                    | Notes         |
| ------- | ------------- | --------------------------------------------------------------------------- | ------------- |
| 1.0     | November 2026 | [OpenBridge_White_Paper.pdf]({{repo}}/blob/HEAD/OpenBridge_White_Paper.pdf) | First edition |

## What each section covers

This summary is based on the text of version 1.0 (13 pages).

1. **Executive summary.** People qualify for help they never get because the path in is hard.
   OpenBridge checks several programs from one set of answers, with no account and no data sent
   anywhere. It is a working prototype that is not ready for the public.
2. **The problem.** The safety net is dozens of programs with different rules. People fall through
   because of fragmentation, complex rules, fear (especially in mixed-status families), and
   practical barriers like shared computers and reading level. The paper notes that its scale
   figures come from different years and methods.
3. **What OpenBridge does.** A session in five steps: welcome, household, income, results, act.
   Answer once, see reasons for every result, get per-person results for Medicaid and WIC, cautious
   outcomes, paperwork help, no dead ends, and navigator mode. It also lists what OpenBridge is not.
4. **Who it serves.** Benefit seekers, community navigators, community organizations, and
   contributors.
5. **How it works.** A Progressive Web App with no backend in Phase 1. A pure, testable engine.
   States stored as data files with cited sources. Privacy built into the design. Made for older
   browsers and low-cost phones.
6. **Current status.** What is built, what is a draft, and what has not started (expert review,
   legal review, a live site).
7. **Limitations and known gaps.** Limits chosen on purpose (it screens and does not decide), rules
   not yet covered, accuracy concerns (draft rules, 2024 figures, few test cases), and product gaps.
8. **Hurdles to overcome.** Blockers (getting the rules right, legal review, earning trust), major
   hurdles (growing to fifty states, adoption, showing impact without tracking, long-term upkeep),
   and minor ones.
9. **Roadmap.** Phases 1 through 4.
10. **Risks and mitigations.** Each main risk and how the project handles it.
11. **How to help.** Expertise and partnership the project needs, and what comes next.
12. **Conclusion.** The technical groundwork is done. What is left is human work: experts, lawyers,
    real users, and a community to keep the rules current.

## Newer than the paper

The paper is a snapshot. For the current plan and status, the
[ROADMAP]({{repo}}/blob/HEAD/ROADMAP.md) is the source of truth. A few details have changed since
version 1.0. For example, the paper gives the first download as about 119 KB compressed, while the
roadmap now says about 146 KB. See [[Roadmap and status|Roadmap-and-Status]].

## How new versions are added

1. Save the new PDF as `docs/white-paper/OpenBridge_White_Paper_vX.Y.pdf`, where `X.Y` is the
   version number (for example, `v1.1`). Earlier versions stay in place.
2. Add a row at the top of the Versions table above with the version, month and year, a link to the
   new file, and a one-line note on what changed.
3. Run `npm run check:wiki` to make sure the new link works.
4. Open a pull request. A maintainer reviews it like any other change.

The first edition stays at the repository root as `OpenBridge_White_Paper.pdf`, because the README
links to it there.

## Related pages

- [[One-Pager]]
- [[Why OpenBridge|Why-OpenBridge]]
- [[Roadmap and status|Roadmap-and-Status]]
