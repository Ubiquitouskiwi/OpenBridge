# Writing wiki pages

This page is the style guide for the OpenBridge wiki. Follow it so every page feels the same and is
easy to read, whoever wrote it, person or AI agent.

## Where the wiki lives

The wiki is edited in the [`wiki/` folder]({{repo}}/tree/HEAD/wiki) of the main repository, not in
the GitHub wiki editor. When a change merges into `mainline`, a workflow publishes the folder to the
GitHub wiki. Edits made directly on GitHub get overwritten.

- Each page is one file: `wiki/Page-Name.md`. The file name is the page name. Use hyphens for
  spaces, and keep names short and plain ("Record-a-Test-Case", not "Fixture-Authoring").
- Keep every page in the top folder. GitHub wikis flatten folders, so subfolders only cause clashes.
- `Home.md` is the front page, `_Sidebar.md` is the menu on every page, and `_Footer.md` is the line
  at the bottom of every page.
- Every new page must be added to `_Sidebar.md`, in the section where a reader would look for it.

## Who we write for

Assume the reader is smart, busy, and new. Many readers are social workers, navigators, legal aid
staff, and policy experts, not programmers. Some are people looking for help.

- Plain words at about an 8th grade level. Short sentences. Say "you".
- Explain a term the first time you use it, or link to the [[Glossary]].
- Lead with what the reader can do. Put background after the steps.
- Be honest about the project's status. Never suggest the rules are verified, the app is launched,
  or results are decisions. They are estimates from draft rules.
- No em dashes and no emoji. Use commas, colons, periods, or parentheses.
- Never include real people's details. Examples use made-up households with round numbers.

## Page layout

Use this shape for most pages:

```markdown
# Page title

One or two sentences: what this page helps you do, and who it is for.

## Before you start (only if there is something to have ready)

## Steps (numbered, one action per step)

## What happens next (or "Tips", "Common questions")

## Related pages (two to four links)
```

- One `#` title per page, then `##` sections. No deeper than `###`.
- Use numbered lists for steps and bullet lists for options.
- Use a short table when comparing a few things side by side.
- Use a `>` quote for one important warning, not for decoration.

## Links

| To link to                        | Write                                                         |
| --------------------------------- | ------------------------------------------------------------- |
| Another wiki page, in a sentence  | `[[Glossary]]` (see the note below for custom link text)      |
| Another wiki page, inside a table | `[the glossary](Glossary)` (a pipe would break the table)     |
| A file in the repository          | `[state adapters]({{repo}}/blob/HEAD/docs/STATE_ADAPTERS.md)` |
| A folder in the repository        | `[data folder]({{repo}}/tree/HEAD/data)`                      |
| A website                         | `[211.org](https://www.211.org/)`                             |

To show your own words for a page link in a sentence, put the text first and the page name
after a pipe: `[[the glossary|Glossary]]`. Do not use that form inside a table.

`{{repo}}` is filled in with the repository's address when the wiki is published. `HEAD` means the
default branch.

The wiki explains how to do things. The detailed technical rules stay in the repository: link to
[`AGENTS.md`]({{repo}}/blob/HEAD/AGENTS.md), [`docs/`]({{repo}}/tree/HEAD/docs), and the
[steering files]({{repo}}/tree/HEAD/.kiro/steering) instead of copying them, so there is only one
place to keep up to date.

## Pictures

Use the screenshots in [`docs/screenshots/`]({{repo}}/tree/HEAD/docs/screenshots). They are made
by a script from the real app with a made-up household, so they stay correct when the app changes.

```markdown
![The results page, with an answer for each program]({{repo}}/raw/HEAD/docs/screenshots/results-top.png)
```

- Write the text in the square brackets for someone who cannot see the picture: say what it shows,
  not "screenshot".
- Put a picture right after the step or paragraph it shows. In a numbered list, indent it three
  spaces so the numbering keeps going.
- Need a picture that does not exist yet? Add it to the script and run `npm run screenshots`. The
  [screenshots guide]({{repo}}/blob/HEAD/docs/screenshots/README.md) explains how. Never use a
  picture of a real person's screen or real case details.

## Check your work

Run this from the repository root before opening a pull request:

```bash
npm run check:wiki
```

It reports broken page links, links to repository files or pictures that do not exist, pages
missing from the sidebar, em dashes, and emoji. It also runs as part of `npm run verify` and in CI.

## Related pages

- [[Ways to help|Contribute-Without-Code]]
- [[Building with AI agents|Building-with-AI-Agents]]
- [[Developer setup|Developer-Setup]]
