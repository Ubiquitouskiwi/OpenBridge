# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Project lead
- **Related:** Requirements Decisions Log Q1-Q43, `AGENTS.md`

## Context

OpenBridge was specified through a structured review that produced 43 recorded decisions (Q1 to
Q43 in `.kiro/specs/openbridge/requirements.md`). Future work will be done by many contributors,
including AI agents in separate sessions with no shared memory. Without a durable record of why
things are the way they are, agents and humans will relitigate settled questions or quietly undo
deliberate choices (for example, the cautious-outcome rules or the no-transmission privacy model).

## Decision

- Decisions Q1 to Q43 remain the historical record in the requirements Decisions Log.
- New significant or hard-to-reverse decisions are recorded as numbered Architecture Decision
  Records in `docs/adr/`, using `0000-template.md`.
- An ADR is required for: a new runtime dependency, a change to the privacy model or encryption,
  a change to the outcome ladder or engine invariants, a data or save-file format change, a new
  program, or a hosting model change.
- Accepted ADRs are immutable except to mark them superseded.

## Options considered

1. **Keep extending the requirements Decisions Log.** Simple, but mixes product requirements with
   implementation decisions and makes one file grow without bound.
2. **ADRs in `docs/adr/` (chosen).** Widely recognized, reviewable one decision per PR, easy for
   agents to find and cite.

## Consequences

Contributors and agents check `docs/adr/` and the Decisions Log before proposing changes in these
areas, and cite the ADR in commits and PRs. A small amount of writing is added to significant PRs.
