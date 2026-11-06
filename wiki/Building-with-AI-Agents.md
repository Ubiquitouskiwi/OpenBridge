# Building with AI agents

Most of OpenBridge's code and documentation is written by AI coding agents, and we say so openly.
This page explains how that works, the rules agents follow, and how to give an agent a good task.
It is for anyone contributing with an AI tool, and for anyone who wants to know how the project
keeps that work trustworthy.

The decision behind this setup is
[ADR-0002]({{repo}}/blob/HEAD/docs/adr/0002-ai-assisted-development-standards.md).

## The contract: `AGENTS.md`

[`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md) is the one operating contract for every agent and
every person. It holds the non-negotiable rules, the commands, the standard workflow, and what
needs human approval. If two documents disagree, `AGENTS.md` wins, then the requirements in
[`.kiro/specs/openbridge/requirements.md`]({{repo}}/blob/HEAD/.kiro/specs/openbridge/requirements.md),
then everything else.

Tool-specific files only point back to it:

- [`CLAUDE.md`]({{repo}}/blob/HEAD/CLAUDE.md) for Claude Code;
- [`.github/copilot-instructions.md`]({{repo}}/blob/HEAD/.github/copilot-instructions.md) for
  GitHub Copilot.

## Topic standards in `.kiro/steering`

Each file in [`.kiro/steering`]({{repo}}/tree/HEAD/.kiro/steering) covers one topic. Front matter
tells tools that support it when to load the file. Any agent can read them as plain Markdown.

| Loaded                                     | Files                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Always                                     | `product.md`, `tech.md`, `structure.md`, `engineering-standards.md`, `testing.md`, `git-and-review.md` |
| Engine, shared, data, scripts              | `eligibility-rules.md`                                                                                 |
| Stores, save, forms, MCP, infra, workflows | `privacy-security.md`                                                                                  |
| Web app, end-to-end tests, PDFs            | `ui-i18n-accessibility.md`                                                                             |
| Only when asked                            | `grill-spec.md` (an expert-panel review of a spec)                                                     |

The exact file patterns are in each file's front matter, and the "Topic standards" table in
`AGENTS.md` section 6 says which to read for which change.

## The standard workflow

Every agent follows the same loop (`AGENTS.md` section 4):

1. Orient: restate the task and read the existing code.
2. Check the spec: find the requirement the change serves.
3. Plan small: one concern, no drive-by refactors.
4. Test first for engine, adapter, crypto, or store logic.
5. Implement to the engineering standards.
6. Verify with `npm run verify` (and `npm run e2e` for UI changes). Never weaken a test to pass.
7. Document: README, `docs/`, steering, wiki, and `CHANGELOG.md`.
8. Report what changed, what was verified, and anything uncertain, marked `ASSUMPTION:`.

## What always needs a human

Agents must never invent rule values, mark an adapter `verified`, or send personal data off the
device. They propose, and wait for an explicit yes, before:

- changing a rule value, a threshold, or the outcome ladder;
- changing the privacy model, encryption, or save-file format;
- adding a runtime dependency or a major version upgrade;
- changing infrastructure, CI workflows, or deployment;
- editing the Terms of Use, disclaimers, referral policy, or license;
- deleting files, data, test cases, or tests;
- publishing, deploying, or pushing anything.

A human maintainer reviews every pull request before it merges, whoever wrote it.

## The `Assisted-by` trailer

Any commit an AI agent wrote or substantially drafted ends with a trailer naming the agent:

```
fix(engine): treat income at the limit as passing

Assisted-by: <agent or model name>
```

The pull request template also asks you to disclose AI help and confirm a human read every line.

## How to give an agent a good task

A good task is small, specific, and checkable. Include:

- **The goal** in one or two sentences, and the requirement or issue it serves.
- **Where to work**: the package or files, and the files it must not touch.
- **Sources** for any rule value, as links. Without a source, tell the agent to leave the value
  alone and report the gap.
- **How to check it**: the commands to run and what "done" looks like.
- **A reminder** to read `AGENTS.md` and the matching steering file first.

For example: "In `data/states/oh/adapter.json`, update `wic.incomeLimitPct` to match this USDA FNS
page (link, published date). Add a test case just under and just over the new limit. Leave the
adapter `draft`. Run `npm run validate:adapters` and `npm run test:fixtures`, then report."

Never paste real people's information into an AI tool or into the repository.

## Related pages

- [[Developer setup|Developer-Setup]]
- [[Add or change a rule|Add-or-Change-a-Rule]]
- [[Writing wiki pages|Writing-Wiki-Pages]]
- [[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]]
