# Developer setup

This page gets the OpenBridge code running on your computer and shows you where things are. It is
for anyone who wants to change code, rule data, or the wiki and run the same checks CI runs.

## Before you start

- **Node 24 LTS, 24.15 or newer.** The version is in [`.nvmrc`]({{repo}}/blob/HEAD/.nvmrc). Node
  22.22.2 or newer also works. Older versions print "Unsupported engine" warnings during `npm ci`. With [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the repository folder.
- **Git**, and a fork or clone of the repository.

**No setup at all:** on the repository page choose **Code**, then **Codespaces**, then **Create
codespace**. It opens a ready-made environment in your browser with Node, the dependencies, and the
test browser already installed (from [`.devcontainer/`]({{repo}}/tree/HEAD/.devcontainer)). GitHub
gives every account free Codespaces hours each month. Skip step 1 below. In step 2, Codespaces offers
to open the app on port 5173; the link works only for you.

## Steps

1. Get the code and install exactly what the lockfile lists:

   ```bash
   git clone https://github.com/UbiquitousKiwi/OpenBridge.git openbridge
   cd openbridge
   nvm use
   npm ci
   ```

   `npm ci` may print "deprecated" and "N vulnerabilities" notices. They come from development
   tools only (`npm audit --omit=dev` reports none), so you do not need to run `npm audit fix`.

2. Start the app in development mode:

   ```bash
   npm run dev -w @openbridge/web-app
   ```

   Open [http://localhost:5173](http://localhost:5173). Use `localhost`, not `127.0.0.1`: the dev
   server listens only on your own computer. Press Ctrl+C to stop it. npm may then print a
   "lifecycle script failed" line, which is normal.

3. Run the full quality gate. This is what CI runs, and it must pass before you open a pull
   request:

   ```bash
   npm run verify
   ```

   It runs formatting, lint, type checks, unit tests, the build, adapter validation, golden test
   cases, reason-key and readability checks, and the wiki check.

4. For changes to the user interface, also run the end-to-end and accessibility tests. The first
   time, install the test browser:

   ```bash
   npx playwright install chromium
   npm run e2e
   ```

## Other useful commands

| Command                                          | What it does                                      |
| ------------------------------------------------ | ------------------------------------------------- |
| `npm run format`                                 | Apply Prettier formatting                         |
| `npm test`                                       | Unit tests only                                   |
| `npm test -w @openbridge/eligibility-engine`     | Unit tests for one package                        |
| `npm run test:fixtures`                          | Golden test cases only                            |
| `npm run validate:adapters`                      | State adapter schema and sources, then test cases |
| `npm run check:wiki`                             | Wiki links, pictures, sidebar, em dashes, emoji   |
| `npm run screenshots`                            | Remake the pictures in `docs/screenshots/`        |
| `npm run rules:apply -- proposal.json --dry-run` | Preview a rule toolkit proposal without writing   |
| `npm run build:local -w @openbridge/web-app`     | Single-file offline build in `dist-local/`        |

The full list is in [`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md) section 3.

## Repository layout

| Path                          | What is there                                                 |
| ----------------------------- | ------------------------------------------------------------- |
| `packages/shared`             | Types, money and date helpers, reason-code keys               |
| `packages/eligibility-engine` | The pure rules engine, one evaluator per program              |
| `packages/form-assembly`      | Document model to PDF                                         |
| `packages/web-app`            | The React app: screens, translations, stores, offline support |
| `packages/mcp-server`         | MCP server so AI assistants can use the engine                |
| `packages/rule-toolkit`       | The offline rule toolkit for experts (no code needed)         |
| `packages/org-dashboard`      | Placeholder for a later organization dashboard (no code yet)  |
| `data/`                       | Federal tables, state adapters with test cases, referrals     |
| `scripts/`                    | Data seeding and CI checks                                    |
| `tooling/`                    | Shared build tooling                                          |
| `packaging/`                  | Files shipped in the hosted and local downloads               |
| `infra/`                      | Reference static hosting on AWS (CDK)                         |
| `docs/`                       | Privacy model, adapter guide, deployment, decisions (ADRs)    |
| `wiki/`                       | This wiki's source                                            |
| `.kiro/specs/openbridge/`     | Requirements, design, and task plan                           |
| `.kiro/steering/`             | Coding and review standards                                   |

More detail: [`.kiro/steering/structure.md`]({{repo}}/blob/HEAD/.kiro/steering/structure.md) and
[[Architecture|Architecture]].

## Where to start

1. Read [`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md). Its rules apply to people as much as to AI
   agents.
2. Read [`CONTRIBUTING.md`]({{repo}}/blob/HEAD/CONTRIBUTING.md) for the branch, commit, and pull
   request workflow.
3. Pick an issue labeled `good first issue` or `help wanted`, and comment that you are on it.
4. For rule data, start with [[Add or change a rule|Add-or-Change-a-Rule]]. For the engine, start
   with [[How the rules engine works|How-the-Rules-Engine-Works]].

## Related pages

- [[Architecture|Architecture]]
- [[Building with AI agents|Building-with-AI-Agents]]
- [[Add or change a rule|Add-or-Change-a-Rule]]
- [[Writing wiki pages|Writing-Wiki-Pages]]
