# ADR-0005: Community rule toolkit

- **Status:** Proposed
- **Date:** 2026-11-06
- **Deciders:** Project lead
- **Related:** AGENTS.md rules 5 and 6, ADR-0004, `wiki/Community-Rule-Toolkit.md`

## Context

The people best able to check OpenBridge's rules (social workers, navigators, legal aid staff,
policy and public health researchers) usually do not write code or use GitHub. Without a tool,
every correction depends on a developer translating an email into a JSON edit, which is slow and
easy to get wrong. Any tool must keep the project's rules: no personal data leaves the device,
every value cites a source, and only an expert sign-off verifies a state.

## Decision

- A separate app, `packages/rule-toolkit`, built as one self-contained HTML file
  (`OpenBridge-Rule-Toolkit.html`) with the shared single-file plugin in `tooling/`, and shipped as
  its own release download. It opens from disk, works offline, makes no network requests (a
  Content-Security-Policy with `connect-src 'none'` enforces this), and stores nothing.
- Three tools: review a state's rules against their sources and download a report; propose a rule
  change with a citation and download a proposal file; check a test case against the engine.
- The proposal format (`openbridge.rule-proposal.v1`), the catalog of reviewable fields, and the
  apply logic live in `packages/shared` (`rule-fields.ts`, `rule-proposal.ts`), so the toolkit and
  the maintainer command `npm run rules:apply` share one definition.
- Applying a proposal is refused if the value changed since the expert saw it, records the
  proposal's source as the field's citation, and always leaves the adapter `draft`.

## Options considered

1. **Electron or another desktop app.** Familiar install experience, but a large download, a heavy
   new dependency, and unsigned apps are blocked or warned about by macOS and Windows.
2. **A hosted web form that opens pull requests.** Smoothest flow, but needs a server, accounts or
   tokens, and moves data off the device.
3. **A single offline HTML file plus a maintainer command (chosen).** No install, no server, no
   credentials, and every change still goes through human review.

## Consequences

- Experts still send files by issue or email; a maintainer runs one command to apply them.
- The toolkit carries the rules from its release; reviewers need a newer download for newer rules.
- Federal figures and new fields need catalog updates in `packages/shared/src/rule-fields.ts`.
- The toolkit reads web-app locale JSON for reason and calculation-step text, as data only.
