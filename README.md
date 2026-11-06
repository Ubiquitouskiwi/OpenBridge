# OpenBridge

**Screen once for the help you already qualify for. Privately, in your browser.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
![Status: prototype](https://img.shields.io/badge/status-prototype-orange.svg)
![Node 24 LTS](https://img.shields.io/badge/node-24_LTS-brightgreen.svg)
![Privacy: no data leaves the device](https://img.shields.io/badge/privacy-on--device_only-2e8b6e.svg)
![Built with AI](https://img.shields.io/badge/built_with-AI_agents-8a2be2.svg)

OpenBridge is an open-source web app that checks a household against several U.S. benefit programs
at once (SNAP, Medicaid and CHIP, WIC, with LIHEAP and TANF in progress), explains every result in
plain language, and helps people get started on the paperwork. It needs no account and sends no
personal data anywhere: every calculation runs on the user's own device.

> [!IMPORTANT]
> **OpenBridge is a Phase 1 prototype and is not ready for public use.** The eligibility rules are
> drafts that have not been verified by subject-matter experts, legal review has not happened, and
> reference figures are from 2024. Results are estimates, not decisions. See [ROADMAP.md](./ROADMAP.md)
> for what remains before launch.

## Why

Millions of eligible people never receive benefits they qualify for. The programs exist; the path
in is the problem. Each program has its own website, its own rules, and its own forms, and nothing
tells a family that qualifying for one usually means qualifying for others. OpenBridge connects
those dots for benefit seekers and for the navigators at food banks, libraries, and clinics who help
them. The [white paper](./OpenBridge_White_Paper.pdf) explains the problem, approach, and known
gaps in detail.

## What it does

- **One questionnaire, many programs.** Household and income are entered once and reused everywhere.
- **Every result is explained.** Plain-language reasons and the factors behind them (value, limit,
  pass or fail), written at about a 6th to 8th grade reading level.
- **Show the math.** Any result expands into the exact arithmetic the engine used, with each rule
  value linked to its official source, so a caseworker can check it against the program manual.
- **What if my income changes?** See how results change with a raise or more hours, and where
  each program, and each person's coverage, may change or stop (benefit cliffs).
- **Per-person results** for Medicaid and WIC, so children who qualify are not hidden behind a
  household "no."
- **Cautious by design.** It never gives a hard "no" near a limit, on missing information, on
  something it cannot compute, or on immigration status alone.
- **Paperwork help.** A printable summary, an Ohio SNAP and Medicaid prefill, and a Spanish
  companion guide for English-only official forms.
- **No dead ends.** When nothing looks likely, it explains why and points to legal aid, 211, and
  local help.
- **Safe on shared computers.** Memory-only data, a one-click clear button, inactivity auto-clear,
  and optional passphrase-encrypted save files.
- **Navigator mode** for screening several clients in a row.
- **Works offline** after the first visit, on older browsers and low-cost phones.

## Status

|                        |                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Programs in the engine | SNAP, Medicaid/CHIP (income-based pathways), WIC, LIHEAP, TANF (early)                                           |
| States                 | Ohio, Texas, Washington (all `draft`, unverified)                                                                |
| Languages              | English, Spanish                                                                                                 |
| Automated checks       | Unit tests, golden eligibility fixtures, adapter validation, readability, end-to-end and axe accessibility tests |
| Deployment             | Not deployed; static hosting and self-host docs ready                                                            |

## Download

Each [GitHub Release](../../releases) has ready-to-use downloads (see
[docs/RELEASING.md](./docs/RELEASING.md)):

| Download                             | For                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `openbridge-local-v*.zip`            | **Use it on your own computer.** Unzip and double-click `OpenBridge.html`. No install, works offline.     |
| `openbridge-hosted-v*.tar.gz`        | **Host it for others.** Static site with Docker, Compose, nginx, Caddy, and a no-dependency start script. |
| `openbridge-image-v*-linux-*.tar.gz` | **Containers.** `docker load -i <file>`, then run on port 8080.                                           |

## Use it with an AI assistant

OpenBridge includes an [MCP server](./packages/mcp-server/README.md) so AI assistants can use it as
their calculator. The assistant handles the conversation; OpenBridge does the math with cited,
versioned rules and returns the same reasons and step-by-step calculation the app shows. It runs
locally over stdio by default. Household details still pass through the AI service you use, so
the server's README explains the privacy tradeoff plainly.

## Quick start

Requires Node 24 LTS (22.12 or newer works).

```bash
git clone <this-repo-url> openbridge
cd openbridge
npm ci
npm run dev -w @openbridge/web-app   # http://localhost:5173
```

Run the full quality gate (the same checks CI runs):

```bash
npm run verify   # format, lint, typecheck, unit tests, build, adapters, fixtures, copy checks
npm run e2e      # end-to-end and accessibility (first time: npx playwright install chromium)
```

## How it works

```
Browser (all personal data stays here, in memory)
  Intake wizard ─▶ Eligibility engine ─▶ Results + reasons ─▶ PDF documents
                        ▲
                 State rules (JSON) + federal tables
Static host delivers only the app and public rule files.
```

- **A pure eligibility engine** (`packages/eligibility-engine`): no network, no storage, no clock, no
  randomness. The same answers always produce the same result, which makes it testable against
  hand-worked "golden" households.
- **States as data** (`data/states/<code>/adapter.json`): every income limit and rule value lives in
  a versioned file with a cited source. Adding a state is data plus test cases, not engine code.
- **Privacy by architecture:** memory-only state, no analytics, no error reporting, WebCrypto
  (PBKDF2 + AES-GCM) for optional save files. See [docs/PRIVACY_MODEL.md](./docs/PRIVACY_MODEL.md).

## Repository layout

| Path                          | Contents                                                           |
| ----------------------------- | ------------------------------------------------------------------ |
| `packages/shared`             | Types, money and date utilities, reason-code keys                  |
| `packages/eligibility-engine` | The rules engine and per-program evaluators                        |
| `packages/form-assembly`      | Document model to PDF                                              |
| `packages/web-app`            | React + Vite PWA (UI, i18n, stores, encryption, offline)           |
| `packages/mcp-server`         | MCP server so AI assistants can use the engine                     |
| `packaging/`                  | Files shipped in the hosted and local release downloads            |
| `data/`                       | Federal tables, state adapters with fixtures, referral directory   |
| `scripts/`                    | Data seeding and CI checks                                         |
| `infra/`                      | Reference static hosting (AWS CDK)                                 |
| `docs/`                       | Privacy model, adapter guide, deployment, accessibility, decisions |
| `.kiro/specs/openbridge/`     | Requirements, design, and implementation plan                      |

## Built with AI, held to a human standard

Most of OpenBridge's code and documentation was written by AI coding agents working from a
detailed, reviewed specification. We think that is a strength, as long as the work is held to the
same bar as any human contribution, and the repo is set up to enforce that:

- [`AGENTS.md`](./AGENTS.md) is the operating contract every agent follows: non-negotiable rules,
  a standard workflow, and the actions that require human approval.
- [`.kiro/steering/`](./.kiro/steering/) holds the topic standards (eligibility rules, privacy,
  accessibility and language, testing, git and review).
- Every behavior traces to a requirement in the spec, every rule value cites a source, and
  `npm run verify` gates every change.
- Agents may not invent rule values or mark a state verified. Only human experts can.
- AI-written commits carry an `Assisted-by:` trailer, and a human maintainer reviews every PR.

## Learn more

The [project wiki](../../wiki) has plain-language guides for everyone: how to use and host
OpenBridge, how to read results, how experts can review rules or record test cases without code,
and how developers add rules and states. Its source is the [`wiki/`](./wiki) folder.

## Contributing

Help is welcome, and much of the most valuable help is not code: benefits and policy expertise to
verify state rules, legal review, accessibility testing, translation, and organizations willing to
pilot. Start with [CONTRIBUTING.md](./CONTRIBUTING.md), and please follow the
[Code of Conduct](./CODE_OF_CONDUCT.md). Security issues go through [SECURITY.md](./SECURITY.md),
not public issues.

## Maintainers

OpenBridge is built and maintained by [StarlingTek, LLC](https://starlingtek.com) as open,
community infrastructure. The code is AGPL-3.0 and will stay open; the project accepts no paid
placement in results or referrals.

- Tyler Starling, project lead

Contact: [openbridge@starlingtek.com](mailto:openbridge@starlingtek.com) for Code of Conduct
reports, partnership, and general questions. Report security issues through
[SECURITY.md](./SECURITY.md) instead.

## License

Copyright (C) 2026 StarlingTek, LLC and OpenBridge contributors.

[GNU Affero General Public License v3.0 only](./LICENSE). Anyone who runs a modified version as a
service must share their changes, so improvements stay available to everyone.

## Disclaimer

OpenBridge is a screening and form-assistance tool. It does not determine eligibility, provide
legal advice, or submit applications. Only the administering agency can decide eligibility. Program
rules in this repository are draft reference data and must be verified against current agency
sources before any public use.
