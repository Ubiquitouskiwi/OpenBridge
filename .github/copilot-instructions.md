# Copilot instructions

Follow [`AGENTS.md`](../AGENTS.md) at the repository root. It is the canonical operating contract
for every AI agent on this project, and the topic standards it references live in
[`.kiro/steering/`](../.kiro/steering/).

The rules that matter most when suggesting code:

- No network calls or storage APIs that could carry personal data. Memory-only state.
- `packages/eligibility-engine` stays pure: no I/O, DOM, i18n, clock, or randomness.
- Never invent eligibility numbers. Rule values come from cited sources in `data/`.
- The engine returns reason codes; the UI localizes them.
- Run `npm run verify` before considering a change done.
