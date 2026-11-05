# ADR-0002: Standards for AI-assisted development

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Project lead
- **Related:** `AGENTS.md`, `.kiro/steering/`, ADR-0001

## Context

Most of OpenBridge is written by AI coding agents. Different agents, tools, and sessions produce
inconsistent results unless they share the same rules, workflow, and quality gate. The domain is
high-stakes: an invented income limit or a dropped privacy guard can harm users, and those mistakes
are exactly the kind agents can make confidently.

## Decision

- `AGENTS.md` is the single canonical, tool-agnostic operating contract. Tool-specific entry points
  (`CLAUDE.md`, `.github/copilot-instructions.md`) only point to it.
- Topic standards live in `.kiro/steering/`, one topic per file, with front matter so tools that
  support it load them automatically (always-on or by file pattern). Any agent can read them as
  plain Markdown.
- One command, `npm run verify`, is the definition of "checked." CI runs the same command.
- Agents may never invent rule values, mark an adapter verified, weaken tests, or take the actions
  listed in `AGENTS.md` section 5 without human approval.
- AI-written commits carry an `Assisted-by:` trailer, and every PR is approved by a human.

## Options considered

1. **No agent-specific guidance; rely on CONTRIBUTING.md.** Too thin to keep agents consistent.
2. **Separate full rule sets per tool.** Drifts quickly and contradicts itself.
3. **One canonical contract plus topic standards (chosen).** One source of truth, discoverable by
   any tool, with detail loaded only where relevant.

## Consequences

Standards must be kept current when the code changes; a stale rule is worse than none. Changes to
`AGENTS.md` or steering files go through review like code. The transparency of this setup is part
of how the project earns trust as an openly AI-built codebase.
