# Use it with an AI assistant

This page explains how an AI assistant (like a desktop AI chat app) can use OpenBridge to check
benefits, what that means for privacy, and how to set it up. It is for anyone curious about this
option. Setup needs a little technical help, so plan to work with a developer or IT person. The
technical source is the [MCP server README]({{repo}}/blob/HEAD/packages/mcp-server/README.md).

> **Status:** early and unverified. Every state's rules are drafts that experts have not reviewed.
> Results are estimates, not decisions, and not legal advice.

## What it does

AI assistants are good at conversation but often guess at income limits. The OpenBridge **MCP
server** fixes that. MCP (Model Context Protocol) is a standard way for an AI app to use outside
tools. With it, the assistant asks the questions in a chat, and OpenBridge does the math with the
same rules, reasons, and cited sources as the OpenBridge web app.

## The privacy tradeoff, plainly

> When you use an AI assistant, your household details go through the AI app and its company. That
> is different from the OpenBridge web app, where nothing leaves your device.

- **The OpenBridge part keeps nothing.** Each check is done in memory and forgotten right away. It
  has no database, makes no internet requests, and does not log your answers.
- **The AI company sees what you type.** The AI app sends your words to its own service. That
  company's privacy terms apply. Read them before you share anything.
- **Names, Social Security numbers, and addresses are never needed.** People are labeled with short
  made-up tags like `self` and `kid1`. Immigration status is optional.

If you want nothing to leave your device, use the [[web app|Using-OpenBridge]] or the
[[local file|Run-OpenBridge-on-Your-Computer]] instead.

## Set it up (with a developer's help)

The server is not in the release downloads yet. You build it from the source code once.

1. **Install the tools.** Install Node.js 24 and Git, then download the OpenBridge repository. See
   [[Developer setup|Developer-Setup]].
2. **Build it.** In the repository folder, run `npm ci` and then `npm run build`.
3. **Connect your AI app.** Most AI apps that support MCP have a settings file. Add an entry like
   this, using the real full path to your copy:

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

   The exact file and wording depend on your AI app. Check its help pages for "MCP servers".

4. **Restart the AI app** and ask it something like "Use OpenBridge to check what benefits a family
   of three in Ohio might get." The assistant will ask you questions and then call OpenBridge.

This setup runs on your own computer and opens no network port. Developers can also run it as a
local web service with `--http` (it listens on `127.0.0.1` port `8787` by default) or with Docker.
Putting it on a public server needs HTTPS and care; the README covers the settings
(`OPENBRIDGE_MCP_HOST`, `OPENBRIDGE_MCP_PORT`, `OPENBRIDGE_MCP_ALLOW_REMOTE`,
`OPENBRIDGE_MCP_ALLOWED_HOSTS`, `OPENBRIDGE_MCP_ALLOWED_ORIGINS`, `OPENBRIDGE_DATA_DIR`,
`OPENBRIDGE_LOCALE_DIR`).

## The tools

The assistant can use four tools. None of them change anything; they only look things up and
calculate.

| Tool                    | What it does                                                                  |
| ----------------------- | ----------------------------------------------------------------------------- |
| `list_supported_states` | Lists the states and programs OpenBridge covers, and their review status.     |
| `get_program_rules`     | Shows a state's rule values and where each one comes from.                    |
| `screen_household`      | Checks a household for every program and explains each result, with the math. |
| `explore_income_change` | Shows how results change with more or less income, and finds benefit cliffs.  |

There is also a built-in guide, `screening_guide`, that tells the assistant how to run a screening
well.

## What the assistant should and should not do

The assistant should:

- Tell you first that your answers pass through the AI service.
- Ask only what is needed, in plain words.
- Explain each result as an estimate, with its reasons.
- Encourage you to apply, and point you to 211 or legal aid.

The assistant should not:

- Ask for names, Social Security numbers, addresses, or phone numbers.
- Say "you do not qualify" as if it were final.
- Make up its own income limits instead of using OpenBridge's answers.
- Fill out or submit an application for you.

If an assistant does any of these, stop and start over, or use the web app instead.

## Related pages

- [[Privacy and your data|Privacy-and-Your-Data]]
- [[Understanding your results|Understanding-Your-Results]]
- [[Architecture]]
- [[Developer setup|Developer-Setup]]
