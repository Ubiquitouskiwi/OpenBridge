# Roadmap

Where OpenBridge is, and what it takes to get to a trustworthy public launch. Detailed phase
scope lives in `.kiro/specs/openbridge/requirements.md` section 12. Last reviewed: November 2026.

## Where we are

Phase 1 is implemented as a prototype. The engine, three draft state adapters, the PWA, documents,
encrypted save, referrals, and offline support are built, and the automated quality gate
(`npm run verify` plus `npm run e2e`) passes. What is missing is mostly the human work that makes
results trustworthy.

## Path to a public pilot

Launch blockers are marked **(blocker)**. Nothing ships to the public until every blocker is done.

### Correctness

- [ ] **(blocker)** Recruit expert reviewers (none yet for any state): social workers, public
      health researchers including epidemiologists, navigators, and legal aid staff. Then complete
      SME review and sign-off of the Ohio adapter,
      recorded in `docs/SME_SIGNOFF.md`.
- [ ] **(blocker)** Identify reviewers for Texas and Washington and complete their sign-off, or
      ship the pilot with those states clearly labeled unverified.
- [ ] **(blocker)** Refresh all reference data to current federal poverty guidelines and SNAP
      figures, with sources, and bump `dataVersion`.
- [ ] Grow golden fixtures to cover every case category in `.kiro/steering/eligibility-rules.md`
      for each state (currently 8 fixtures total).
- [ ] Decide the long-term owner of the January (FPL) and October (SNAP) refresh cycle.

### Legal and trust

- [ ] **(blocker)** Legal review of Terms of Use, disclaimers, referral directory policy, privacy
      statements, and license (`docs/LEGAL_REVIEW.md`).
- [ ] Decide contributor terms (Developer Certificate of Origin or a CLA).
- [ ] Independent review of the privacy claims (no transmission, memory-only, encryption).

### Product quality

- [ ] **(blocker)** Usability sessions with benefit seekers and navigators; revise intake wording.
- [ ] **(blocker)** Manual accessibility pass with screen readers (`docs/ACCESSIBILITY_CHECKLIST.md`).
- [ ] Build the Ohio SNAP and Medicaid templates against the current official Ohio Benefits forms
      (today the prefill is a structured field list).
- [ ] Expand the referral directory to county-level coverage in pilot states (currently 5 entries).
- [ ] Spanish copy reviewed by a qualified translator.

### Engineering hygiene

- [x] Upgrade Vite 5 to 8, Vitest 2 to 5, Zod 3 to 4, React Router 6 to 7, and tooling to Node 24
      LTS. Production dependencies now report no known vulnerabilities; remaining advisories are
      moderate or low and limited to dev tooling (typescript-eslint and workbox chains).
- [x] Keep the PDF renderer out of the first load (lazy chunk; entry is about 146 KB gzipped).
- [ ] Add type-aware ESLint rules and test coverage reporting.
- [ ] **(blocker)** Finish translation coverage: much of the intake and several screens still
      have hardcoded English, so Spanish mode is only partly Spanish (`IntakeWizard.tsx`,
      `validation.ts`, `SaveProgress.tsx`, `DownloadForms.tsx`, `DashboardView.tsx`,
      `HelpView.tsx`, `Welcome.tsx`, `AppHeader.tsx`, `AutoClearWarning.tsx`, PDF titles in
      `buildModels.ts`). Menus also show raw codes such as `biweekly` and `us_citizen`. Remove the
      remaining em dashes and the lock emoji from UI copy. Terms of Use copy moves after legal
      review.
- [ ] Show the unused "rules still being reviewed" banner (`draft_adapter_warning`) on results.
- [ ] Fix the saved-file "rules changed since you saved" notice, which is set and then lost when
      `ResumeView` navigates away.
- [ ] Display `orgName`, `contact`, and `localResources` from `deployment-config.json`, and apply
      partial config files instead of ignoring them.
- [ ] Cite sources for every adapter value (many, such as `medicaid.pregnantLimitPct` and
      `medicaid.childTiers`, show "Source not listed yet" in Show the math).
- [ ] Fix `scripts/seed-fpl-data.ts`: it rewrites `data/federal/snap.json` without `abawdMinAge`,
      `abawdMaxAge`, and `elderlyAge` (which validation requires) and never updates
      `data/federal/sources.json`. Make `dataVersion` reflect SNAP-only updates too.
- [ ] Bring Texas and Washington to at least three fixtures each, and every state up to the full
      fixture category list in `.kiro/steering/eligibility-rules.md`.
- [ ] Reconsider adapter `lastVerified` dates while adapters are still `draft` (they read as if a
      review happened).

### Releases

- [x] One-button GitHub Release with a hosted download, a single-file local download, and
      prebuilt container images (`docs/RELEASING.md`).
- [x] Release the community rule toolkit as its own download (`openbridge-rule-toolkit-v*.zip`).

### Community tools and documentation

- [x] Community rule toolkit for non-programmers (`packages/rule-toolkit`, ADR-0005): review a
      state's rules against their sources, propose a rule change with a citation, and check test
      cases, in one offline file; maintainers apply proposals with `npm run rules:apply`.
- [ ] Toolkit next steps: Spanish copy, reviewing federal figures (poverty line, SNAP amounts),
      and opening an adapter file from a pull request to review it before merge.
- [x] GitHub wiki (`wiki/`): overview, white paper versions, using and hosting the app, expert
      review, the toolkit, adding rules and states, and developer guides.

### Publishing

- [ ] Publish the repository, enable branch protection on `mainline`, private vulnerability reporting,
      and Dependabot.
- [ ] Deploy a pilot instance for partner organizations.

## After the pilot

- **Phase 2:** full LIHEAP and TANF, about 10 states, more official form templates, an organization
  dashboard, white-label theming, navigator training materials, more languages.
- **Phase 3:** optional encrypted cloud sessions for organizations, staff accounts, Unemployment
  Insurance, a case-management API, about 25 states, privacy-preserving impact metrics.
- **Phase 4:** national coverage for the core programs, 211 integration, a governance model and
  long-term home.

## Known limitations (by design or not yet built)

Medicaid covers income-based (MAGI) pathways only; CHIP is approximated through Medicaid child tiers;
WIC caps at "possibly eligible" because nutritional risk is assessed in person; SNAP work
requirements, vehicle assets, and itemized self-employment costs are not computed; only three
states are covered; there are no accounts or usage analytics. The
[white paper](./docs/whitepaper/OpenBridge_White_Paper.pdf) covers these in depth.
