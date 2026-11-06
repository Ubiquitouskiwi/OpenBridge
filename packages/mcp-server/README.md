# @openbridge/mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that lets AI assistants
use the OpenBridge eligibility engine. The AI does the talking. OpenBridge does the math, with
cited, versioned rules, and explains every result in plain English.

Use it when you want an assistant (a desktop AI app, a coding agent, or your own agent) to help
someone check SNAP, Medicaid/CHIP, WIC, LIHEAP, and TANF without guessing at income limits. The
assistant collects the answers in conversation and calls the tools; the numbers, reasons, and
citations come from the same engine and rule files as the OpenBridge web app.

> **Status:** early and unverified. Every state's rules are a **draft** that subject-matter
> experts have not reviewed yet. Results are estimates, not decisions, and not legal advice. Only
> the agency that runs a program can decide who qualifies.

## Privacy model, in plain words

- **OpenBridge stores nothing and logs nothing.** Each tool call is computed in memory and
  forgotten when it returns. The server makes no outbound network calls, has no database, and
  logs only "started" and "stopped" lines.
- **But the household details pass through the AI app and its model provider.** Unlike the
  OpenBridge web app (where nothing leaves the device), the person's answers are typed into an
  AI service, which sends them to its model and then to this server. That service's own privacy
  terms apply. People should know this before they share anything.
- **Names, Social Security numbers, and addresses are never needed.** The tool schemas tell the
  assistant not to collect or send them. People are labeled `self`, `kid1`, and so on.
  Immigration status is optional, and `prefer_not_to_say` is always accepted.

The web app's no-transmission guarantee does not change. This server is a separate, optional
component. See [ADR-0003](../../docs/adr/0003-mcp-server-for-ai-agents.md).

## Setup: stdio (local AI apps)

Build once from the repo root:

```bash
npm ci
npm run build
```

Then point your MCP client at the built entry. Most clients take a JSON config like this (the
exact file and key names depend on the client):

```json
{
  "mcpServers": {
    "openbridge": {
      "command": "node",
      "args": ["/absolute/path/to/OpenBridge/packages/mcp-server/dist/cli.js"]
    }
  }
}
```

The `openbridge-mcp` bin runs the same file. Stdio is the default; no port is opened.

## Setup: Streamable HTTP

```bash
node packages/mcp-server/dist/cli.js --http
# serving Streamable HTTP at http://127.0.0.1:8787/mcp
```

- Binds **127.0.0.1** by default and checks the `Host` and `Origin` headers (localhost only), which
  blocks DNS-rebinding attacks from web pages.
- Binding any non-loopback address is refused unless you set **both**
  `OPENBRIDGE_MCP_ALLOW_REMOTE=1` and `OPENBRIDGE_MCP_ALLOWED_HOSTS` (the host names clients will
  use; the `Host` header is checked against it).
- **There is no built-in authentication.** It is a public, anonymous calculator by design. If you
  serve a restricted audience, put standard authentication in front of it, for example an
  authenticating reverse proxy, and terminate TLS there. Do not add a home-made token scheme.
- Stops cleanly on `SIGINT` and `SIGTERM`.

### Environment variables

| Variable                         | Default                                  | Meaning                                                       |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| `OPENBRIDGE_MCP_HOST`            | `127.0.0.1`                              | Address to bind in `--http` mode.                             |
| `OPENBRIDGE_MCP_PORT`            | `8787`                                   | Port in `--http` mode.                                        |
| `OPENBRIDGE_MCP_ALLOW_REMOTE`    | unset                                    | Must be `1` to bind a non-loopback address.                   |
| `OPENBRIDGE_MCP_ALLOWED_HOSTS`   | unset                                    | Comma-separated `Host` allowlist; required for a remote bind. |
| `OPENBRIDGE_MCP_ALLOWED_ORIGINS` | same as allowed hosts                    | Comma-separated `Origin` host names for a remote bind.        |
| `OPENBRIDGE_DATA_DIR`            | bundled copy, else repo `data/`          | Reference data directory (`federal/`, `states/<code>/`).      |
| `OPENBRIDGE_LOCALE_DIR`          | bundled copy, else web app `locales/en/` | English locale directory.                                     |

All data and locale files are validated with Zod at startup; a bad file stops the server with
the file name.

## Docker

The image runs `--http`. Build from the repo root and publish to loopback only:

```bash
docker build -f packages/mcp-server/Dockerfile -t openbridge-mcp .
docker run --rm -p 127.0.0.1:8787:8787 openbridge-mcp
```

Inside the container the server binds `0.0.0.0` with `OPENBRIDGE_MCP_ALLOW_REMOTE=1` and
`OPENBRIDGE_MCP_ALLOWED_HOSTS=localhost,127.0.0.1`, so only the loopback publish above can reach
it. Exposing it publicly is your decision as the operator. It needs a TLS reverse proxy, a
matching `OPENBRIDGE_MCP_ALLOWED_HOSTS`, and standard auth if the audience is restricted. It runs
as the unprivileged `node` user.

## Tools

All tools are read-only, idempotent, and deterministic for the same input and date. Money is in
**integer US cents**. An unsupported state returns an `isError` result that names the supported
states and suggests 211.

| Tool                    | Input                                                                     | Returns                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_supported_states` | none                                                                      | States, their programs, `verificationStatus`, `lastVerified`, data version and FPL year.                                                                             |
| `get_program_rules`     | `stateCode`                                                               | Each program's rule values with the citation for each, uncited fields, and a draft notice.                                                                           |
| `screen_household`      | `household`, optional `evaluationDate` (YYYY-MM-DD, default today in UTC) | Per program: outcome, English reasons, factor checks, the math with citations (or "no citation listed yet"), per-person results, next steps, apply link, disclaimer. |
| `explore_income_change` | `household`, optional `evaluationDate`, `deltasMonthlyCents`, scan size   | Results at each income change, and benefit cliffs per program and per person, with plain-English summaries and the disclaimer.                                       |

Every tool returns both `structuredContent` (for the agent to reason over) and a readable text
version. The server also sends **instructions** at connection time and offers a
`screening_guide` prompt: ask only what is needed, in plain words; never collect names, SSNs, or
addresses; never present "you do not qualify" as final; encourage applying and contacting 211 or
legal aid; and tell people their answers pass through the AI service they are using.

## Development

```bash
npm run build -w @openbridge/mcp-server      # tsc + copy data and locale into dist/assets
npm run typecheck -w @openbridge/mcp-server
npm run lint -w @openbridge/mcp-server
npm test -w @openbridge/mcp-server           # includes an in-process MCP client end-to-end test
```

`dist/` (including the copied `dist/assets/`) is git-ignored.

## Disclaimers

OpenBridge gives estimates only. It is not a decision and not legal advice. The rules are drafts
pending expert review. Only the agency decides. Anyone who wants help should apply, and can call
211 or a local legal aid office.
