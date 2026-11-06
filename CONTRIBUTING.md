# Contributing to OpenBridge

Thanks for helping connect people to the benefits they qualify for. You do not need to write code
to make a real difference here.

## Ways to help

- **Verify rules.** Benefits navigators, caseworkers, agency staff, and policy researchers can check
  state rule values and test households. Use the "Eligibility rule correction" issue template.
- **Add a state.** See `docs/STATE_ADAPTERS.md` and the "New state" issue template.
- **Translate** or review Spanish copy, or help add a language.
- **Test accessibility**, especially with screen readers (`docs/ACCESSIBILITY_CHECKLIST.md`).
- **Pilot it** at your organization and tell us what works and what does not.
- **Write code.** Check issues labeled `good first issue` or `help wanted`.

## Ground rules

New to the project? The [wiki](../../wiki) walks you through each way to help, step by step,
starting with "Ways to help" for contributions that need no code.

Read [`AGENTS.md`](./AGENTS.md) before your first code change. It applies to humans as much as to
AI agents. The short version:

1. No personal data leaves the device, ever. No analytics, telemetry, or storage of user data.
2. The eligibility engine stays pure and cautious: never a hard "no" when a pathway may exist,
   never on immigration status alone.
3. Every rule value cites an official source. Only subject-matter experts mark a state verified.
4. User-facing text is plain (8th grade or below), translatable, and accessible.
5. Every change is tested and passes `npm run verify`.

Topic standards live in [`.kiro/steering/`](./.kiro/steering/): eligibility rules, privacy and
security, UI and accessibility, testing, and git and review.

## Setup

```bash
nvm use            # Node 24 LTS (see .nvmrc)
npm ci
npm run dev -w @openbridge/web-app
```

Before opening a pull request:

```bash
npm run format     # apply Prettier
npm run verify     # the same gate CI runs
npm run e2e        # for UI changes (first time: npx playwright install chromium)
```

## Workflow

1. Open or find an issue, and comment that you are working on it.
2. Branch from `mainline`: `feat/<short-name>`, `fix/<short-name>`, `data/<state>-<change>`.
3. Keep the change to one concern, with tests.
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/), e.g.
   `fix(engine): treat income at the limit as passing`. If an AI agent wrote or substantially
   drafted the commit, add an `Assisted-by: <agent or model>` trailer.
5. Open a PR using the template, link the issue and the requirement IDs it serves, and update
   `CHANGELOG.md` under `Unreleased`.
6. A maintainer reviews every PR. Significant decisions get an ADR in `docs/adr/`.

## Using AI tools

AI-assisted contributions are welcome and expected. You are responsible for every line you submit:
read the diff, run the checks, and make sure the agent followed `AGENTS.md`. Disclose AI assistance
in the PR template. Never paste real people's information into an AI tool or into this repository.

## Conduct and security

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). Report vulnerabilities privately
as described in [SECURITY.md](./SECURITY.md). For questions and where to get help, see
[SUPPORT.md](./SUPPORT.md).

## License

OpenBridge is stewarded by StarlingTek, LLC. By contributing, you agree that your contributions are
licensed under the project's [AGPL-3.0-only](./LICENSE) license. You keep the copyright to your own
contributions.
