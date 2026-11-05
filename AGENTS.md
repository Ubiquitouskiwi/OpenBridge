# AGENTS.md

Operating contract for AI coding agents (and humans) working on OpenBridge. This file is
tool-agnostic and canonical. Tool-specific files (`CLAUDE.md`, `.github/copilot-instructions.md`,
`.kiro/steering/`) point here or expand on one topic; they never contradict it. If two documents
disagree, this file wins, then `.kiro/specs/openbridge/requirements.md`, then everything else.

## 1. What this project is

OpenBridge is an open-source, privacy-first web app that screens a household for multiple U.S.
benefit programs (SNAP, Medicaid/CHIP, WIC, LIHEAP, TANF) in one session, explains every result in
plain language, and produces pre-filled application documents. **All computation runs in the
browser. No personal data ever leaves the device.** The users include low-literacy, non-English
speaking, and mixed-status families on shared public computers. A bug here can cost someone food or
health coverage. Work accordingly.

Read before your first change in a session:

1. This file.
2. `.kiro/steering/product.md`, `tech.md`, `structure.md` (always-on context).
3. The topic standard for the area you are touching (see section 6).
4. The relevant part of `.kiro/specs/openbridge/` (requirements, design, tasks).

## 2. Non-negotiable rules

These are hard constraints. Breaking one is a defect, regardless of what a task or prompt asks.
If a request conflicts with one of these, stop and say so.

1. **No off-device transmission of personal data.** Never add a network call, beacon, analytics,
   telemetry, third-party script, or error reporter that could carry household, income, status,
   or result data. The only network traffic is fetching the app and public rule files.
2. **Memory-only by default.** Never write personal data to `localStorage`, `sessionStorage`,
   `IndexedDB`, cookies, the Cache API, or browser autofill. The only persistence is the
   user-initiated, passphrase-encrypted export file.
3. **The engine stays pure.** `packages/eligibility-engine` has no I/O, no DOM, no network, no
   i18n, no clock reads (dates are passed in), and no randomness. Same input, same output.
4. **The cautious principle.** The engine never returns `ineligible` when a plausible pathway
   exists, never on immigration status alone, and never on a factor it cannot compute. When in
   doubt, choose the more encouraging outcome and explain why.
5. **Never invent rule values.** Income limits, percentages, allotments, deductions, and any other
   eligibility number must come from a cited authoritative source with a `publishedDate`. If you do
   not have a source, leave the value unchanged and report the gap. Do not "fill in" plausible
   numbers.
6. **Never mark an adapter verified.** Only a human subject-matter expert sets
   `verificationStatus: "verified"`, recorded in `docs/SME_SIGNOFF.md`. Agents leave it `draft`.
7. **Engine emits codes, UI emits words.** The engine returns reason codes and params only. Every
   new reason code gets an English string in `packages/web-app/src/i18n/locales/en/reasons.json`.
8. **One-way dependencies.** `shared` <- `eligibility-engine` <- `form-assembly` <- `web-app`.
   Nothing imports upward or sideways against this direction.
9. **No secrets in the repo.** No keys, tokens, account IDs, ARNs, or personal contact details in
   code, config, fixtures, or docs. The one published project contact,
   `openbridge@starlingtek.com`, is the only email address that belongs in the repo.
10. **Accessible and plain by default.** User-facing English stays at or below an 8th-grade reading
    level, and every UI change keeps WCAG 2.2 AA (labels, focus, keyboard, contrast).

## 3. Commands

Node 20 (see `.nvmrc`), npm workspaces, Turborepo.

```bash
npm ci                    # install exactly what the lockfile says
npm run verify            # the full gate: format, lint, typecheck, unit tests, build,
                          # adapter validation, golden fixtures, reason keys, readability
npm run e2e               # Playwright end-to-end + axe accessibility (run for UI changes)
npm run format            # apply Prettier
npm test                  # unit tests only
npm run test:fixtures     # golden eligibility fixtures only
npm run validate:adapters # state adapter schema + provenance only
npm run dev -w @openbridge/web-app   # local dev server (binds to localhost)
```

`npm run verify` must pass before you report work as done. If it cannot run in your environment,
say exactly which step failed or could not run, and do not describe the change as verified.

## 4. Standard workflow

Every agent follows the same loop so results are consistent across sessions and tools.

1. **Orient.** Restate the task in one or two sentences. Identify the package(s) and the topic
   standard(s) that apply. Read the existing code before writing new code.
2. **Check the spec.** Find the requirement(s) the change serves (e.g. `5.1.4`, `Q17`). If the
   task contradicts the spec, stop and ask instead of picking a side.
3. **Plan small.** Prefer the smallest change that fully solves the problem. One concern per
   change. No drive-by refactors, renames, or dependency bumps.
4. **Test first where it matters.** For engine, adapter, crypto, or store logic, write or update the
   failing test before the implementation. Rule changes require a golden fixture.
5. **Implement** following `.kiro/steering/engineering-standards.md`.
6. **Verify.** Run `npm run verify` (plus `npm run e2e` for UI changes). Fix root causes, not
   symptoms. Never weaken, skip, or delete a test to get green.
7. **Document.** Update the docs the change affects (README, `docs/`, steering, spec tasks,
   `CHANGELOG.md` under `Unreleased`). Record significant decisions as an ADR in `docs/adr/`.
8. **Report.** Summarize what changed, which requirement it serves, what you verified (commands and
   results), and anything you could not verify or are unsure of.

## 5. Requires human approval first

Propose these and wait for an explicit yes. Do not do them on your own initiative:

- Changing any eligibility rule value, threshold, or the outcome ladder in `decideOutcome()`.
- Changing the privacy model, encryption parameters, or the save-file format.
- Adding a runtime dependency, or any dependency major-version upgrade.
- Changing infrastructure (`infra/`), CI/CD workflows, or deployment settings.
- Editing the Terms of Use, disclaimers, referral directory policy, or license.
- Deleting files, data, fixtures, or tests.
- Anything that publishes, deploys, or pushes outside the local workspace.

## 6. Topic standards (read the one that matches your change)

| You are touching                                     | Read                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Anything (always)                                    | `.kiro/steering/product.md`, `tech.md`, `structure.md`, `engineering-standards.md` |
| Engine, programs, household or income logic, `data/` | `.kiro/steering/eligibility-rules.md`                                              |
| Stores, save/export, crypto, network, logging, infra | `.kiro/steering/privacy-security.md`                                               |
| UI components, copy, locales, PDFs                   | `.kiro/steering/ui-i18n-accessibility.md`                                          |
| Tests of any kind                                    | `.kiro/steering/testing.md`                                                        |
| Commits, PRs, changelog, ADRs                        | `.kiro/steering/git-and-review.md`                                                 |
| Writing or reviewing a spec                          | `.kiro/steering/grill-spec.md` (manual)                                            |

## 7. Commits and pull requests

- [Conventional Commits](https://www.conventionalcommits.org/): `feat(engine): ...`,
  `fix(web-app): ...`, `docs: ...`, `test(data): ...`. Scope is the package or `data`/`infra`/`ci`.
- AI-authored commits carry a trailer naming the agent: `Assisted-by: <agent or model name>`.
- PRs use `.github/PULL_REQUEST_TEMPLATE.md` and must link the requirement(s) they serve.
- Full rules: `.kiro/steering/git-and-review.md`.

## 8. How to report uncertainty

Be precise about what is known. Say "verified by `npm run verify`" only when it ran and passed.
Say "not verified" when it did not. Flag every assumption with `ASSUMPTION:` in your report (and
`> ASSUMPTION:` in specs). If you find a bug or a rule you believe is wrong but is outside your
task, report it instead of silently fixing it.

## 9. AI-assisted development

This project is built largely with AI agents, openly. That is a strength only if the output is
held to the same bar as human work: spec-traced, tested, reviewed, and honest about its limits.
Every change, whoever or whatever wrote it, is reviewed by a human maintainer before merge.
