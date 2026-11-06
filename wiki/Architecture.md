# Architecture

This page gives contributors a map of how OpenBridge fits together: the packages, how data moves,
and the design choices that keep personal data on the device. Detail lives in the repository;
this page links to it.

## The packages and the one-way rule

OpenBridge is one repository with several npm workspace packages. Dependencies only point one way:

```
shared  <-  eligibility-engine  <-  form-assembly  <-  web-app
shared  <-  eligibility-engine  <-  mcp-server
```

| Package                       | Job                                                                  |
| ----------------------------- | -------------------------------------------------------------------- |
| `packages/shared`             | Types, money and date helpers, reason-code keys. Depends on nothing. |
| `packages/eligibility-engine` | The pure rules engine. Depends only on `shared`.                     |
| `packages/form-assembly`      | Turns a document model into a PDF. Today it imports only `shared`.   |
| `packages/web-app`            | The React app: screens, translations, stores, offline support.       |
| `packages/mcp-server`         | Lets AI assistants call the engine.                                  |
| `packages/org-dashboard`      | A placeholder for a later organization dashboard. No code yet.       |

Nothing imports against the arrows. The MCP server reads the web app's English locale files as
data, never its code. The rule is in [`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md) section 2, and
the folder map is in [`.kiro/steering/structure.md`]({{repo}}/blob/HEAD/.kiro/steering/structure.md).

## How data flows

```
Browser (all personal data stays here, in memory)
  Screening questions -> Eligibility engine -> Results and reasons -> PDF documents
                               ^
                State rules (JSON) and federal tables
The host only delivers the app and the public rule files.
```

1. The person answers questions at `/screen`. Answers live in memory-only Zustand stores in
   `packages/web-app/src/store/`.
2. The app passes the answers, the state adapter, the federal data, and today's date to
   `evaluateEligibility()`. See [[How the rules engine works|How-the-Rules-Engine-Works]].
3. The engine returns outcomes, reason codes, and calculation steps. The app turns codes into
   English or Spanish with i18next.
4. PDFs are built on the device by `form-assembly`.

Rule data is plain JSON in [`data/`]({{repo}}/tree/HEAD/data), bundled into the app at build time
(`packages/web-app/src/data/index.ts`).

## Privacy by architecture

Privacy is built in, not added by policy:

- No accounts, analytics, telemetry, error reporting, or third-party scripts.
- Personal data is never written to browser storage, cookies, or caches. The only way to keep a
  screening is a save file the person chooses to download, encrypted with their passphrase using
  WebCrypto (PBKDF2 and AES-GCM).
- The engine cannot do I/O at all, so it cannot leak anything.

The full model is in [`docs/PRIVACY_MODEL.md`]({{repo}}/blob/HEAD/docs/PRIVACY_MODEL.md). For a
plain-language version, see [[Privacy and your data|Privacy-and-Your-Data]].

## Two builds of the same app

| Build                | Command                                      | Output                                        | Notes                                                                 |
| -------------------- | -------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Hosted (PWA)         | `npm run build`                              | `packages/web-app/dist`                       | Installable, works offline after first load through a service worker. |
| Standalone (offline) | `npm run build:local -w @openbridge/web-app` | `packages/web-app/dist-local/OpenBridge.html` | One file that opens from disk. No service worker; uses a hash router. |

Both builds go into the release downloads. See [[Making a release|Making-a-Release]],
[[Host it for others|Host-OpenBridge]], and [[Run it on your computer|Run-OpenBridge-on-Your-Computer]].

## The MCP server

[`packages/mcp-server`]({{repo}}/blob/HEAD/packages/mcp-server/README.md) exposes the same engine
and rule files to AI assistants through the Model Context Protocol. It has four read-only tools
(`list_supported_states`, `get_program_rules`, `screen_household`, `explore_income_change`) and
runs over stdio by default, or over HTTP bound to `127.0.0.1`. It keeps each request in memory and
never logs or stores household data. The tradeoff: the household's answers do pass through the AI
service the person uses. See [[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]]
and [ADR-0003]({{repo}}/blob/HEAD/docs/adr/0003-mcp-server-for-ai-agents.md).

## Decisions (ADRs)

Big, hard-to-reverse choices are written down as Architecture Decision Records in
[`docs/adr`]({{repo}}/tree/HEAD/docs/adr). Earlier decisions (Q1 to Q43) are in the Decisions Log
of [`.kiro/specs/openbridge/requirements.md`]({{repo}}/blob/HEAD/.kiro/specs/openbridge/requirements.md).
To propose one, copy `docs/adr/0000-template.md` to the next number and open a pull request. A
new dependency, a privacy model change, an outcome ladder change, or a data format change all
need an ADR.

## Related pages

- [[Developer setup|Developer-Setup]]
- [[How the rules engine works|How-the-Rules-Engine-Works]]
- [[Privacy and your data|Privacy-and-Your-Data]]
- [[Making a release|Making-a-Release]]
