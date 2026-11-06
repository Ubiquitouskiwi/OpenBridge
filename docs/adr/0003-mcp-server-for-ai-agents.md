# ADR-0003: MCP server for AI agents

- **Status:** Proposed
- **Date:** 2026-11-06
- **Deciders:** Project lead (pending review)
- **Related:** `AGENTS.md` rules 1, 3, 5, 7; `docs/PRIVACY_MODEL.md`; requirements 5.9, 5.10;
  `packages/mcp-server`

## Context

People increasingly ask AI assistants about benefits. Left alone, an assistant guesses at income
limits from training data, which can be stale or wrong, and a confident wrong "you don't
qualify" can end someone's search for help. OpenBridge already has a pure, deterministic engine
with cited, versioned rule data and plain-English reason strings. The Model Context Protocol
(MCP) is the common way for AI apps and agents to call outside tools.

Forces: do no harm (correct, cautious, explained results); privacy (the web app promises nothing
leaves the device); transparency (every number cites its source); low maintenance (no second
rules engine); security (anything that listens on a network must be safe by default).

## Decision

Add an optional workspace package, `@openbridge/mcp-server`, built on the official MCP
TypeScript SDK v2 (`@modelcontextprotocol/server` 2.4.0, `@modelcontextprotocol/node` 2.1.2,
Apache-2.0) with Zod 4 for its own schemas. It exposes four read-only, deterministic tools
(`list_supported_states`, `get_program_rules`, `screen_household`, `explore_income_change`), server
instructions, and a `screening_guide` prompt. It calls the existing engine unchanged and renders
English from the web app's English locale files.

- **Transports:** stdio by default; `--http` serves Streamable HTTP at `/mcp` on 127.0.0.1:8787,
  with Host and Origin validation in front of the handler. A non-loopback bind requires
  `OPENBRIDGE_MCP_ALLOW_REMOTE=1` plus an explicit `OPENBRIDGE_MCP_ALLOWED_HOSTS` list.
- **No built-in authentication.** It is a public, anonymous calculator. Operators serving a
  restricted audience put standard auth (for example an authenticating reverse proxy) in front.
  No home-made token scheme.
- **Every result carries a disclaimer** (estimates only, not a decision, not legal advice, draft
  rules, only the agency decides) and treats immigration status as optional.

### Privacy-model scope

The web app's no-transmission guarantee is unchanged: the browser app still sends no personal
data anywhere. The MCP server is a separate, optional component with a different, explicitly
documented model. It **receives household data from the calling agent**, keeps it in memory for
the duration of one request only, and **must never log, store, or forward it**. It makes no
outbound network calls. Household data does pass through the user's AI app and its model
provider; the README, tool descriptions, and server instructions say so, and tell agents never to
collect names, SSNs, or addresses.

## Options considered

1. **Do nothing; let assistants answer from general knowledge.** No work, but answers are
   uncited, often stale, and not cautious. Rejected: it fails "do no harm".
2. **Publish the rule JSON and let agents do the math.** Simple, but every agent reimplements the
   engine differently, and the cautious outcome ladder is lost. Rejected.
3. **A custom REST API.** Works, but each AI app needs bespoke glue, and it invites a hosted,
   always-on service. Rejected in favor of the standard protocol.
4. **An MCP server over the existing engine (chosen).** One engine, standard integration, local
   stdio by default, HTTP optional. Cost: three new runtime dependencies and a second privacy
   model to explain.

## Consequences

- Easier: any MCP-capable assistant can give cited, cautious, explained estimates.
- Harder: we maintain an SDK dependency (v2 is new; watch for breaking changes), a Zod 4 copy
  alongside the repo's Zod 3, and the agent-facing copy (instructions, disclaimer, tool
  descriptions) as a reviewed user-facing surface.
- Must hold: the server never logs, stores, or forwards request contents; new tools stay
  read-only; any change to the disclaimer or privacy wording gets maintainer review.
- Revisit if: a hosted public deployment is proposed (needs an operations and abuse review),
  tools that write or submit anything are proposed, or the MCP spec changes its security model.
