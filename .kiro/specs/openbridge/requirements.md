# OpenBridge — Base Specification

> Status: **Build-ready draft (v4).** Refined through expert-panel reviews and a pre-design sweep (2026-07-02).
> All Blocker, Major, and Minor open items are resolved (see the Decisions Log, Q1–Q43).
> Detailed design and an implementation task list will be added later as `design.md` and `tasks.md`.

## 1. Overview

OpenBridge is an open-source tool that helps people determine which government assistance
programs they qualify for (SNAP, Medicaid/CHIP, WIC, LIHEAP, TANF, and later Unemployment
Insurance), generates pre-filled application PDFs, and tracks submission status locally — all
in a single session, with privacy built in by design.

The problem is not that benefits do not exist. It is that the system to access them is
fragmented, confusing, and exhausting. People who qualify for SNAP almost always qualify for
Medicaid and WIC too, but nothing connects the dots for them.

### Motivating data (from prior research; verify before production use)

- ~5.7M people on SNAP/Medicaid are eligible for WIC but not enrolled (USDA).
- ~9M older adults are eligible for SNAP but not enrolled (NCOA).
- ~3.7M children are eligible for Medicaid/CHIP but uninsured (Georgetown CCF).
- ~28% of eligible workers never file for unemployment insurance (WorkRise/EPI).

> Note: These figures come from different years and methodologies. They motivate the project
> but must be re-verified against current agency data before any public claims.

## 2. Goals and Non-Goals

### Goals

- Screen a household for eligibility across multiple programs in one intake session.
- Explain *why* someone is or is not likely eligible, in plain language, with full transparency.
- Generate pre-filled, human-readable application PDFs matching official form layouts.
- Let the user track application status locally.
- Connect users to professional/legal help and produce a shareable review bundle.
- Be deployable by community organizations (food banks, libraries, health centers, 211).
- Scale to all 50 states through community-contributed, data-driven "state adapters."

### Non-Goals (Phase 1)

- Direct API integration with government portals (states rarely permit it).
- Providing legal advice or representation (we assist and refer; we do not advise).
- Disbursing benefits or acting as a system of record.
- Automated filing — OpenBridge generates forms; humans review and submit them.
- Full case management beyond lightweight, local application tracking.
- Server-side storage or transmission of personal data.
- Non-MAGI Medicaid (aged/blind/disabled, medically-needy, spend-down), WIC nutritional-risk
  determination, SNAP ABAWD computation, and vehicle-asset valuation (all deferred; see §7).

### 2.1 Success measurement (Phase 1)

Because Phase 1 ships with no analytics (Q32), impact is measured through community-org
self-reporting: screenings completed, applications generated, and enrollments navigators
attribute to OpenBridge. A quantitative funnel (screenings → applications → enrollments),
program coverage, and languages used are candidate metrics deferred to a later phase when
privacy-preserving aggregate measurement is added.

## 3. Guiding Principles

1. **Client-first computation** — All eligibility logic runs in the browser. No personal data
   touches a server unless the user explicitly opts in to saving progress (Phase 3+).
2. **Data-driven rules** — Eligibility rules live in versioned JSON config files. New state
   adapters and reference data are contributable without touching engine code.
3. **PWA, offline-first** — Must work on library computers, low-cost Android phones, and spotty
   connections. Service workers cache rule sets and form templates; full offline after first load.
4. **Forms, not API integration** — Generate PDFs that match official forms and guide the user
   to transfer data into the official portal.
5. **Augmentation, not replacement** — A community-org dashboard lets one navigator screen many
   families quickly. Empower human helpers rather than replace them.
6. **Privacy and trust** — No account required by default; data is memory-only unless exported;
   exportable and deletable; especially important for immigrant and mixed-status communities.
7. **Radical transparency** — At every step the app tells the user, in plain language they can
   understand regardless of tech literacy, exactly what data is stored and where, and that
   nothing leaves their device unless they choose to export it.
8. **Cautious and transparent eligibility** — The engine never discourages a plausibly-eligible
   person and never over-promises. It never outputs a hard "no" on a factor it cannot compute.
   It always shows its reasoning and the factors behind every outcome.

## 4. Primary Users

- **Benefit seekers** — Individuals and families, including low-literacy, low-tech, non-English-
  speaking, and mixed-status users on shared/public devices.
- **Community navigators** — Caseworkers/volunteers screening clients in batch.
- **Contributors** — Developers, policy experts, and translators maintaining state adapters,
  rules, referral directories, and localizations.

## 5. Requirements (EARS format)

### 5.1 Eligibility screening

**User Story:** As a benefit seeker, I want to answer a guided questionnaire once and see which
programs I likely qualify for, so that I do not have to research each program alone.

#### Acceptance Criteria

1. WHEN a user completes the intake questionnaire THEN OpenBridge SHALL evaluate every supported
   program for the user's state and return exactly one result per program.
2. WHEN OpenBridge returns a program result THEN it SHALL include an outcome, structured reason
   codes rendered as plain-language reasoning, and the factors (value vs. threshold vs. pass/fail)
   that drove the decision.
3. WHEN eligibility depends on self-reported, unverifiable inputs THEN OpenBridge SHALL return
   `likely_eligible` rather than `eligible`.
4. WHEN a result is within 10% of a threshold OR a required input is missing THEN OpenBridge SHALL
   return `possibly_eligible`, never `ineligible`.
5. WHEN any plausible eligibility pathway exists THEN OpenBridge SHALL NOT return `ineligible`.
6. WHEN a member's `eligibilityStatus` is `undocumented`, `prefer_not_to_say`, or otherwise status-
   complex THEN OpenBridge SHALL NOT mark that person `ineligible` on status alone; it SHALL evaluate
   children and pregnant members on status-blind program rules and route status-complex cases to a
   navigator/referral.
7. WHEN a household already receives a qualifying program (e.g., SNAP/TANF/SSI) THEN OpenBridge SHALL
   apply categorical/adjunctive eligibility where the program rules allow it.
8. WHEN no program returns `eligible`, `likely_eligible`, or `possibly_eligible` THEN OpenBridge SHALL
   NOT present a bare dead-end: it SHALL explain why in non-discouraging language, route to the
   referral directory and 211/local resources, surface any out-of-scope "other pathways" note, and
   offer the review-bundle export.
9. WHEN a program's eligibility is determined per person (Medicaid, CHIP, WIC) THEN OpenBridge SHALL
   return an outcome for each relevant household member, plus a program-level rollup outcome equal to
   the most encouraging member outcome; household-scoped programs (SNAP, LIHEAP, TANF) return a single
   household outcome.
10. WHEN a user selects their state THEN OpenBridge SHALL treat that as an attestation of state
    residency and record it; residency is assumed satisfied unless the user indicates otherwise.

### 5.2 Multi-program cross-referencing

**User Story:** As a benefit seeker, I want to enter my income and household details once and have
them apply to every program, so that I avoid duplicate data entry.

#### Acceptance Criteria

1. WHEN a user enters household and income data THEN OpenBridge SHALL reuse that data across all
   program evaluations without re-prompting.
2. WHEN evaluating a program THEN OpenBridge SHALL derive that program's specific household definition
   from the shared household roster rather than assuming one household model fits all.
3. WHEN income or employment is required at the member level (Medicaid MAGI, SNAP ABAWD) but was
   entered unattributed THEN OpenBridge SHALL downgrade the affected result to `possibly_eligible`
   with reason code `RESULT_LIMITED_BY_MISSING_INCOME_ATTRIBUTION`.
4. WHEN a user qualifies for one program THEN OpenBridge SHALL surface related programs the household
   is likely eligible for.

### 5.3 Pre-filled application generation

**User Story:** As a benefit seeker, I want completed application PDFs, so that I can submit them
without re-entering everything.

#### Acceptance Criteria

1. WHEN a user is likely eligible for SNAP or Medicaid in Ohio THEN OpenBridge SHALL generate a
   pre-filled PDF matching that program's official Ohio (Ohio Benefits) form layout in English.
2. WHEN a program or state has no official-form template THEN OpenBridge SHALL generate a generic
   "application summary sheet" containing all entered data in a clean, printable format.
3. WHEN the user's selected language is not English THEN OpenBridge SHALL also generate a
   language-specific companion guide explaining how to complete and submit the English application.
4. WHEN a PDF is generated THEN OpenBridge SHALL list the supporting documents the user needs and
   the next steps to submit.

### 5.4 Status tracking and resume (local only)

**User Story:** As a benefit seeker, I want to track where each application stands and come back
later, so that I know what to do next.

#### Acceptance Criteria

1. WHEN a user has generated applications THEN OpenBridge SHALL let them record and view submission
   status per program on-device.
2. OpenBridge SHALL NOT persist tracking data on a shared device by default; the user MAY export an
   encrypted progress file or print a checklist.
3. WHEN a returning user selects "I have a saved file" THEN OpenBridge SHALL restore their session by
   importing the encrypted file and prompting for the passphrase.
4. WHEN an imported file's `dataVersion` is older than the current rules THEN OpenBridge SHALL notify
   the user that rules changed and prompt a re-check.
5. OpenBridge SHALL NOT automatically restore a prior session on a shared device (nothing is persisted
   to restore from by default).

### 5.5 Privacy, PII handling, and disclaimers

**User Story:** As a benefit seeker, I want my personal data to stay private and to understand the
tool's limits, so that I feel safe using it.

#### Acceptance Criteria

1. WHEN a user completes screening THEN OpenBridge SHALL perform all eligibility computation client-side.
2. IF a user does not opt in to saving progress THEN OpenBridge SHALL keep personal data in memory only
   and SHALL NOT transmit or persist it beyond the active session.
3. WHEN a user opts to save progress or export a bundle THEN OpenBridge SHALL encrypt the data client-
   side using a user passphrase (WebCrypto PBKDF2 + AES-GCM), store no key, provide no recovery, and
   allow the user to export and delete it at any time.
4. OpenBridge SHALL enumerate the specific PII it collects and treat all of it as session-only by default.
5. WHEN a user reaches results THEN OpenBridge SHALL display a prominent disclaimer that it assists with
   form completion, is not legal advice, and that complex cases should seek professional review.
6. OpenBridge SHALL NOT collect analytics that capture PII; Phase 1 SHALL ship with no user analytics at all.
7. OpenBridge SHALL NOT transmit client error/crash data in Phase 1; any future error capture SHALL be
   allowlist-based (error type, stack, non-PII app state only) and SHALL never include form values,
   `HouseholdProfile` contents, or reason-code parameters.

### 5.6 Data transparency and plain language

**User Story:** As a user with low tech literacy, I want to always understand what is happening with my
data and to read everything easily, so that I trust the tool.

#### Acceptance Criteria

1. WHEN a user is on any screen that collects or stores data THEN OpenBridge SHALL show, in plain
   language and with supporting icons, what data is being saved and where it is stored.
2. WHEN no data has left the device THEN OpenBridge SHALL clearly state that the user's information is
   only on their device and has not been sent anywhere.
3. WHEN a user is about to export or transmit data THEN OpenBridge SHALL explain, before the action, what
   will be shared and with whom, in plain language, and require explicit consent.
4. All user-facing copy (intake, results, reasoning, notices) SHALL target a 6th–8th grade reading level,
   enforced by a CI readability check on the English source strings.
5. Numeric inputs SHALL provide inline help and examples, accept flexible formats ($ and commas), and
   pair every field with a plain-language label.

### 5.7 Shared-device data hygiene (individual mode)

**User Story:** As a benefit seeker on a library or shared device, I want my information gone when I
finish, so that the next person can't see it.

#### Acceptance Criteria

1. OpenBridge SHALL present an always-visible "Clear my data / Start over" control that wipes all in-
   memory state and any transient storage.
2. WHEN the user is in individual mode and inactive past a configurable timeout THEN OpenBridge SHALL
   auto-clear session data, after showing an accessible "are you still there?" warning that does not
   penalize slow readers.
3. OpenBridge SHALL keep session data in memory only and SHALL NOT write to localStorage, IndexedDB, or
   browser autofill unless the user explicitly saves an encrypted file.

### 5.16 Operating modes

**User Story:** As either an individual or a navigator, I want the tool to behave appropriately for my
context, so that privacy and workflow both work.

#### Acceptance Criteria

1. OpenBridge SHALL support two modes, selectable at start or set per deployment: **individual**
   (self-screening) and **navigator** (staffed batch screening).
2. WHEN in individual mode THEN OpenBridge SHALL apply the shared-device hygiene rules in §5.7.
3. WHEN in navigator mode THEN OpenBridge SHALL support batch screening of multiple households, retain
   those sessions in memory under navigator control for the duration of the active session, and provide
   explicit "clear client / next client" controls; it SHALL still keep data in memory only (no disk
   persistence unless exported) and SHALL replace individual-mode inactivity auto-clear with a
   navigator-controlled lock/clear suited to a staffed setting.

### 5.8 Offline and low-resource support

**User Story:** As a benefit seeker on a library computer or low-cost phone, I want the tool to work with
limited connectivity.

#### Acceptance Criteria

1. WHEN the app has loaded once THEN OpenBridge SHALL allow completing screening offline using cached
   rules and form templates.
2. WHEN new reference data ships in an app update THEN offline clients SHALL pick it up on next update via
   a service-worker cache-bust keyed to `dataVersion`.

### 5.9 Localization

**User Story:** As a non-English speaker, I want the tool in my language.

#### Acceptance Criteria

1. WHEN a user selects a supported language THEN OpenBridge SHALL present intake, results, reasoning, and
   guidance in that language.
2. The system SHALL ship with English and Spanish and support adding languages via locale files.
3. WHEN the engine returns reasoning THEN it SHALL return structured reason codes with parameters, and the
   presentation layer SHALL localize them (the engine SHALL NOT emit user-facing English).
4. WHEN a reason code lacks a string in the active locale THEN the UI SHALL fall back to English, then to a
   humanized rendering of the code, and SHALL NOT display the raw code key. CI SHALL fail if any reason code
   lacks an English string and SHALL warn for gaps in other locales.

### 5.10 State adapters (extensibility)

**User Story:** As a contributor, I want to add support for a new state by editing config, not code.

#### Acceptance Criteria

1. WHEN a contributor adds a valid state adapter config THEN OpenBridge SHALL evaluate that state without
   engine code changes.
2. WHEN a state adapter is loaded THEN OpenBridge SHALL expose its `verificationStatus`, `lastVerified`,
   `lastVerifiedBy`, and per-value provenance sources.
3. WHEN a state adapter omits a program THEN OpenBridge SHALL present that program with outcome `unknown`
   and a "not yet supported in your state" message plus a link to the official program page; it SHALL NOT
   silently omit the program.
4. WHEN an adapter has `verificationStatus: 'draft'` THEN OpenBridge SHALL show a visible caveat that its
   rules are unverified.

### 5.11 Community organization dashboard

**User Story:** As a community navigator, I want to screen multiple clients efficiently.

#### Acceptance Criteria

1. WHEN a navigator uses the org dashboard (Phase 2) THEN OpenBridge SHALL support on-device batch screening
   of multiple households with no accounts and no server dependency.
2. WHEN generating reports THEN OpenBridge SHALL only expose privacy-preserving, aggregate statistics.
3. Multi-user accounts and authentication (Cognito) are deferred to Phase 3.

### 5.12 Professional / legal referral and review bundle

**User Story:** As a benefit seeker with a complex case, I want to reach someone who can help and to hand
them everything they need, so that I am not stuck.

#### Acceptance Criteria

1. WHEN a user needs help THEN OpenBridge SHALL present a curated referral directory built from bundled
   static data without sending any user data, prioritizing nonprofit legal aid, government-funded programs,
   211, and state bar referral services; private firms SHALL appear only if they meet a published, no-fee
   inclusion standard.
2. WHEN a user chooses to contact a referral THEN OpenBridge SHALL use device-native tap-to-call or tap-to-
   email links, not a server-side handoff.
3. WHEN a user wants a case reviewed THEN OpenBridge SHALL generate a "review bundle" (generated PDFs plus an
   application summary) locally and let the user export/share it themselves, offering a plain PDF or a
   passphrase-encrypted file.
4. WHEN a user initiates any export or share of the review bundle THEN OpenBridge SHALL first show an explicit
   plain-language consent screen describing what is included and that the user is sending it; the bundle SHALL
   carry its own privacy notice.
5. Every referral view SHALL state that OpenBridge does not endorse and is not responsible for listed
   providers, and directory inclusion SHALL never be paid.

### 5.13 Terms of Use and liability

**User Story:** As the project, we need clear legal boundaries, so that assisting users does not create
undue liability or cross into unauthorized practice of law.

#### Acceptance Criteria

1. OpenBridge SHALL present plain-language Terms of Use covering form-assistance-not-legal-advice, no
   warranty, and limitation of liability, acknowledged at first run or accessible from the footer.
2. The referral and Terms posture SHALL be reviewed by qualified legal counsel before public launch
   (open dependency; see Assumptions).

### 5.14 Correctness assurance and adapter verification

**User Story:** As a stakeholder, I need confidence the eligibility results are correct, so that we do not
harm the people we serve.

#### Acceptance Criteria

1. Every state adapter SHALL ship a `fixtures/` set of golden `HouseholdProfile → expected outcome per
   program` cases, including edge cases (threshold boundaries, categorical eligibility, elderly/disabled,
   mixed-status).
2. CI SHALL fail if engine output diverges from any fixture.
3. An adapter SHALL be marked `verified` only after SME review of its rule values, provenance, and fixtures,
   recorded in `lastVerifiedBy`/`lastVerified`; Ohio SHALL be signed off by the Franklin County SMEs.
4. Required rule values (income limits, allotments, expansion thresholds) SHALL carry provenance sources,
   validated by `validate-state-adapter.ts`.

### 5.15 Reference-data freshness

**User Story:** As a stakeholder, I need the figures to stay current, so that results reflect today's rules.

#### Acceptance Criteria

1. The project SHALL run two scheduled reference-data refreshes — a January FPL update and an October SNAP
   allotment/deduction update — each bumping `dataVersion`, updating provenance `effectiveDate`s, and
   requiring SME re-verification before release.
2. WHEN a dataset is past its `expectedRefreshDate` THEN OpenBridge SHALL show a plain-language "figures may
   be out of date, verify with the agency" caveat rather than silently using stale values.

## 6. Supported Programs (initial scope)

| Program | Category | Phase | Notes |
|---|---|---|---|
| SNAP | Nutrition | 1 | Gross/net income tests, BBCE, categorical eligibility, deductions; ABAWD flagged only |
| Medicaid / CHIP | Healthcare | 1 | MAGI pathways only; non-MAGI/ABD out of scope |
| WIC | Nutrition | 1 | 185% FPL, adjunctive eligibility; caps at `possibly_eligible` (clinic risk assessment); no status test |
| LIHEAP | Housing/Energy | 2 | 110–200% FPL by state, categorical if on SNAP |
| TANF | Cash assistance | 2 | State-variable limits, time limits, work requirements |
| Unemployment Insurance | Cash assistance | 3 | Needs per-member employment |
| SSI/SSDI | Disability | 3+ | |

## 7. Key Business Rules (summary)

- **Outcome selection (deterministic, cautious):**
  - `eligible` — every hard test passes with verified inputs (rare client-side).
  - `likely_eligible` — passes tests but relies on self-reported, unverifiable inputs.
  - `possibly_eligible` — within 10% of a threshold, a required input is missing, income/employment
    attribution is missing for a member-level test, or a factor is uncomputable (WIC risk, vehicle assets).
  - `ineligible` — a hard disqualifier applies AND no plausible pathway remains (never on status alone).
  - `unknown` — no adapter/program data available.
  - When torn, the engine SHALL choose the more encouraging outcome.
- **Eligibility status (per member):** `us_citizen | national | lpr_5yr_plus | lpr_under_5yr |
  refugee_asylee_humanitarian | other_qualified | undocumented | prefer_not_to_say`. Never disqualifies on
  status alone; children/pregnant members evaluated on status-blind rules.
- **Income model:** `incomeSources[]` (each typed, with `frequency`, `earned`, optional `memberId`) is the
  source of truth; `grossMonthlyIncome` is derived by summing normalized monthly amounts. Normalization
  factors: weekly ×4.333, biweekly ×2.167, semimonthly ×2, annual ÷12, hourly × hours/week × 4.333.
  Self-employment is counted net (receipts − expenses); "unsure" → `possibly_eligible`.
- **Household model:** one shared roster of members with attributes; each program derives its own household
  (SNAP unit, Medicaid MAGI household, etc.). MAGI construction requires member-level income attribution.
- **Result scope:** Medicaid, CHIP, and WIC produce a result **per household member** plus a program-level
  rollup equal to the most encouraging member outcome; SNAP, LIHEAP, and TANF produce a single household
  result.
- **FPL basis:** FPL is computed **per program** using that program's household-size rules; a pregnant
  member counts as 2+ where the program specifies.
- **Program independence:** every program is evaluated **independently**; adjunctive/categorical eligibility
  is conferred only from **actual receipt** flags (`receivesSnap`/`receivesMedicaid`/`receivesCashAssistance`),
  never from another program's computed result in the same run.
- **Residency:** selecting a state is a recorded attestation of state residency; residency is assumed
  satisfied unless the user indicates otherwise.
- **Age:** `dateOfBirth` preferred (age computed in years, months for under-2s, at a snapshot `evaluationDate`);
  direct age entry allowed as fallback but members within ~1 year of a threshold are flagged `possibly_eligible`.
- **FPL:** `calculateFpl(householdSize, region)` with region derived from `stateCode` via `regionForState()`
  (`AK→alaska`, `HI→hawaii`, else `contiguous`); all three tables bundled.
- **SNAP** — Gross income ≤130% FPL (up to 200% under BBCE); net income ≤100% FPL (waived under BBCE); asset
  test $2,750 / $4,250 with elderly/disabled (waived under BBCE); categorical eligibility if receiving
  TANF/SSI/GA; benefit ≈ max allotment − (net income × 0.30), floored at the federal minimum benefit
  ($23 for 1–2 person households) — all thresholds config values. ABAWD flagged, never disqualifying. Vehicle
  asset test documented but not evaluated (flagged near the asset limit).
- **Medicaid** — MAGI pathways only. Expansion states cover adults to ~138% FPL; non-expansion adult limits are
  very low; children's limits are higher and tiered by age; SNAP receipt often creates a presumption of
  eligibility. Non-MAGI/ABD/medically-needy/spend-down are out of scope and surfaced as "other pathways may
  apply — see a navigator" when 65+/disabled/high-medical signals appear.
- **WIC** — 185% FPL; adjunctive eligibility via SNAP/Medicaid/TANF; no immigration-status test; caps at
  `possibly_eligible` because nutritional risk is assessed at a WIC clinic.
- **LIHEAP** — 110–200% FPL by state; categorical eligibility if on SNAP; benefit set by state agency (screen only).
- **TANF** — Highly state-variable limits; 60-month federal lifetime limit (often shorter); work requirements
  typically 20–30 hours/week.

### 7.1 Required inputs per program

Missing a **required** input downgrades that program's result to `possibly_eligible` (per §5.1.4).
Optional inputs improve accuracy but never block a result. All programs require `stateCode`
(residency attestation) and the household roster.

| Program | Scope | Required to screen | Improves accuracy (optional) |
|---|---|---|---|
| SNAP | Household | member roster (ages, relationships), income sources | shelter/utility, dependent-care, child support paid, medical (elderly/disabled), assets (non-BBCE only) |
| Medicaid | Per person | member roster (ages, pregnancy, relationships), member-attributed income | prior Medicaid receipt |
| CHIP | Per person (children) | child members (ages), household income | — |
| WIC | Per person | members with WIC category (pregnant/postpartum/breastfeeding/infant/child &lt;5), income OR adjunctive receipt flag | — (also capped at `possibly_eligible` for clinic risk assessment) |
| LIHEAP | Household | member roster, income, utility responsibility | heating/cooling costs |
| TANF | Household | member roster (dependent child present), income | assets, work hours |

## 8. Technology Direction

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite (PWA) | Type safety, large contributor pool, PWA support |
| Build target | ES2019 | Works on older library-computer browsers |
| UI | Tailwind CSS + Headless UI | Accessible by default, small bundle |
| State | Zustand | Lightweight, client-side friendly, memory-only default |
| Forms/validation | React Hook Form + Zod | Shared validation between UI and engine |
| i18n | react-i18next | Lazy-loaded locale files; localizes engine reason codes with English fallback |
| PDF generation | @react-pdf/renderer | React components to PDF |
| Encryption | WebCrypto (PBKDF2 + AES-GCM) | Built-in, offline, no dependency |
| Testing | Vitest + Playwright; golden fixtures | Unit + E2E + eligibility correctness |
| Readability | Flesch–Kincaid CI check (English source) | Enforces 6th–8th grade target |
| Monorepo | Turborepo | Workspace management |
| Hosting (Phase 1) | S3 + CloudFront via GitHub Actions | AWS-native static hosting, offline-first fit |
| Analytics (Phase 1) | None (CloudWatch infra metrics only) | Privacy-maximal launch posture |
| Backend (Phase 3+) | Fastify on AWS Lambda | Serverless, scales to zero |
| Database (Phase 3+) | DynamoDB | Encrypted at rest, TTL auto-expiry |
| Auth (Phase 3+) | Amazon Cognito | Org dashboard staff accounts |
| Rule distribution | Bundled versioned JSON (Phase 1); S3 + CloudFront later | Offline-first, no live dependency |
| Infrastructure | AWS CDK (TypeScript) | Reproducible, version-controlled |

### Non-functional targets

- **Accessibility:** WCAG 2.2 AA. (Full conformance requires manual assistive-tech testing.)
- **Readability:** 6th–8th grade reading level, CI-checked on English source strings.
- **Browser support:** last-2-versions of Chrome/Edge/Firefox/Safari, plus older library-browser reality via
  the ES2019 target; no hard dependency on cutting-edge web APIs.
- **Performance:** initial JS ≤250KB gzipped; interactive in <5s on a throttled mid-range Android; fully
  functional offline after first load.

> Licensing intent: **AGPL-3.0** so improvements stay open. Confirm the license choice before publishing.

## 9. Proposed Repository Structure

```
openbridge/
├── packages/
│   ├── eligibility-engine/   # Pure TypeScript rules engine (shared lib)
│   │   └── src/{engine.ts, types.ts, reason-codes.ts, programs/, rules/, utils/}
│   ├── form-assembly/        # PDF generation (generators/, templates/, pdf-builder.ts)
│   ├── web-app/              # PWA frontend (routes/, components/, hooks/, store/, locales/)
│   ├── org-dashboard/        # Community org batch screening tool (local-only, Phase 2)
│   └── shared/               # Shared types, utils, constants
├── data/
│   ├── federal/              # poverty-guidelines.{contiguous,alaska,hawaii}.json, snap-max-allotments.json (with provenance + effectiveDate)
│   ├── states/               # oh/, tx/, wa/ (snap.json, medicaid.json, wic.json, meta.json, fixtures/)
│   └── referrals/            # curated legal-aid / gov / bar / firm directory (static, structured)
├── infra/                    # AWS CDK (frontend/api/data/monitoring stacks) — Phase 3+
├── scripts/                  # seed-fpl-data.ts, validate-state-adapter.ts
├── docs/                     # ARCHITECTURE, DEPLOYMENT (self-host), PRIVACY_MODEL, STATE_ADAPTERS
├── README.md
├── LICENSE                   # AGPL-3.0
├── CONTRIBUTING.md
├── SECURITY.md
├── turbo.json
└── tsconfig.base.json
```

## 10. Core Data Models (reference)

```ts
type ProgramId = 'snap' | 'medicaid' | 'chip' | 'wic' | 'liheap' | 'tanf' | 'ui' | 'ssi_ssdi';
type FplRegion = 'contiguous' | 'alaska' | 'hawaii';

type EligibilityStatus =
  | 'us_citizen' | 'national' | 'lpr_5yr_plus' | 'lpr_under_5yr'
  | 'refugee_asylee_humanitarian' | 'other_qualified' | 'undocumented' | 'prefer_not_to_say';

type EmploymentStatus =
  'employed' | 'unemployed' | 'self_employed' | 'retired' | 'disabled' | 'student';

interface HouseholdMember {
  id: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling'
    | 'grandparent' | 'other_relative' | 'non_relative';
  dateOfBirth?: string;                  // ISO; preferred
  age?: number;                          // fallback if no DOB; boundary cases flagged possibly_eligible
  eligibilityStatus?: EligibilityStatus; // replaces isCitizen; never disqualifies alone
  employmentStatus?: EmploymentStatus;   // per-member (drives ABAWD/UI)
  isDisabled?: boolean;
  isPregnant?: boolean;
  isStudent?: boolean;
}

type IncomeSourceType = 'wages' | 'self_employment' | 'social_security' | 'ssi'
  | 'unemployment' | 'child_support' | 'pension' | 'veterans_benefits' | 'workers_comp' | 'other';
type IncomeFrequency = 'hourly' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'annual';

interface IncomeSource {
  type: IncomeSourceType;
  amount: number;
  frequency: IncomeFrequency;
  hoursPerWeek?: number;                 // required when frequency = 'hourly'
  earned: boolean;                       // drives SNAP earned-income deduction
  memberId?: string;                     // optional; unattributed => member-level results downgrade
}

interface HouseholdProfile {
  members: HouseholdMember[];
  incomeSources: IncomeSource[];         // source of truth
  grossMonthlyIncome: number;            // derived = sum of normalized monthly amounts
  monthlyHousingCost?: number;
  monthlyUtilityCost?: number;
  monthlyChildcareCost?: number;
  monthlyChildSupportPaid?: number;
  monthlyMedicalExpenses?: number;
  liquidAssets?: number;
  county: string;                        // local routing/links; not Phase 1 math
  stateCode: string;
  fplRegion: FplRegion;                  // derived from stateCode
  isStateResident?: boolean;             // attested via state selection; default true
  receivesCashAssistance?: boolean;      // actual receipt; used for adjunctive eligibility
  receivesMedicaid?: boolean;
  receivesSnap?: boolean;
}

type AppMode = 'individual' | 'navigator';

type EligibilityOutcome =
  'eligible' | 'likely_eligible' | 'possibly_eligible' | 'ineligible' | 'unknown';

interface ReasonCode { code: string; params: Record<string, string | number>; }

interface FactorRow { labelCode: string; value: string; threshold: string; passes: boolean; }

// Present for per-member programs (Medicaid, CHIP, WIC).
interface MemberEligibility {
  memberId: string;
  outcome: EligibilityOutcome;
  reasons: ReasonCode[];
  factors: FactorRow[];
  estimatedBenefit?: number;
}

interface ProgramEligibilityResult {
  programId: ProgramId;
  scope: 'household' | 'per_member';
  outcome: EligibilityOutcome;           // household outcome, or most-encouraging rollup for per_member
  reasons: ReasonCode[];                 // household-level; localized by the UI, not the engine
  factors: FactorRow[];
  memberResults?: MemberEligibility[];   // present when scope = 'per_member'
  estimatedBenefit?: number;             // SNAP only in Phase 1
  fplCalculation: {                      // per program (household size per that program's rules)
    householdSize: number; region: FplRegion; fplAmount: number; percentageOfFpl: number;
  };
  nextStepCodes: string[];
  applyUrl: string;
  requiredDocumentCodes: string[];
}

interface EligibilityResult {
  profile: HouseholdProfile;
  results: ProgramEligibilityResult[];
  evaluationDate: string;                // ISO snapshot for reproducible age/results
  rulesLastUpdated: string;
  dataVersion: string;
}

interface ProvenanceSource { field: string; sourceName: string; url: string; publishedDate: string; note?: string; }

interface StateAdapter {
  stateCode: string;
  stateName: string;
  medicaidExpansion: boolean;
  programs: {
    snap?: SnapStateConfig;
    medicaid?: MedicaidStateConfig;
    wic?: WicStateConfig;
    liheap?: LiheapStateConfig;
    tanf?: TanfStateConfig;
  };
  portalUrls: Record<string, string>;
  sources: ProvenanceSource[];           // provenance for required values
  verificationStatus: 'verified' | 'draft';
  lastVerified: string;                  // ISO date
  lastVerifiedBy: string;
}

interface ReferralEntry {
  type: 'legal_aid' | 'gov' | 'bar_referral' | 'firm';
  name: string;
  coverageArea: string;                  // state/county
  categories: string[];                  // e.g. 'immigration', 'benefits', 'housing'
  languages: string[];
  phone?: string; email?: string; url?: string;
  lastVerified: string;
}

interface DeploymentConfig {
  orgName?: string;
  contact?: string;
  defaultMode: AppMode;                  // individual | navigator
  autoClearTimeoutSeconds: number;       // individual-mode shared-device hygiene
  localResources?: { label: string; url: string }[];
}
```

## 11. Engine API Contract (reference)

```ts
// Pure function, no side effects. Returns structured reason codes; UI localizes.
function evaluateEligibility(
  profile: HouseholdProfile,
  stateAdapter: StateAdapter,
  evaluationDate: string,
  programs?: ProgramId[],
): EligibilityResult;

function evaluateSnap(profile: HouseholdProfile, state: StateAdapter, fpl: number): ProgramEligibilityResult;
function evaluateMedicaid(profile: HouseholdProfile, state: StateAdapter, fpl: number): ProgramEligibilityResult;
function evaluateWic(profile: HouseholdProfile, state: StateAdapter, fpl: number): ProgramEligibilityResult;
function evaluateLiheap(profile: HouseholdProfile, state: StateAdapter, fpl: number): ProgramEligibilityResult;
function evaluateTanf(profile: HouseholdProfile, state: StateAdapter, fpl: number): ProgramEligibilityResult;

function regionForState(stateCode: string): FplRegion;
function calculateFpl(householdSize: number, region: FplRegion): number;
function normalizeMonthly(source: IncomeSource): number;

// Floored at the federal minimum benefit (config-driven).
function estimateSnapBenefit(netIncome: number, householdSize: number, maxAllotment: number, minBenefit: number): number;
```

## 12. Phased Roadmap

- **Phase 1 (Core + pilot):** Eligibility engine for SNAP/Medicaid/WIC; pilot states **Ohio** (expansion +
  integrated Ohio Benefits, Franklin County SME sign-off), **Texas** (non-expansion), **Washington**
  (expansion + BBCE); English + Spanish; PWA with offline support; SNAP + Medicaid PDF for Ohio plus generic
  summary sheets; local-only status tracking + resume; referral directory + review-bundle export; Terms of Use;
  hosted on S3+CloudFront with self-host docs; golden-fixture + SME verification; no analytics.
- **Phase 2 (Assembly + expansion):** More official-form templates; add LIHEAP and TANF; expand to ~10 states;
  local-only org dashboard batch screening; white-label theming; navigator training materials; more languages.
- **Phase 3 (Tracking + integration):** Optional encrypted cloud sessions (Cognito/DynamoDB); multi-user org
  accounts; add UI screening; API for case-management integration; expand to ~25 states; publish open-source repo;
  revisit privacy-preserving analytics.
- **Phase 4 (Scale + sustainability):** National coverage for SNAP/Medicaid/WIC; 211 integration; governance model;
  ownership of the January/October reference-data release cycles.

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| State rules change frequently | Community-maintained adapters; provenance + `effectiveDate`; scheduled Jan/Oct refresh + SME re-verify |
| Portals reject pre-filled forms | Generate PDFs matching official layouts + transfer guidance |
| Wrong eligibility math harms users | Golden fixtures in CI + SME sign-off gate; draft/unverified state; cautious outcomes |
| Duplicating other civic-tech efforts | Position as open infrastructure; seek partnership |
| Trust deficit in immigrant communities | No account; memory-only + auto-clear; radical transparency; status never disqualifies alone |
| Unauthorized practice of law / referral liability | Form-assistance scope; Terms + no-endorsement; legal-aid-first vetted directory; counsel review before launch |
| Sensitive data lingering on shared devices | Memory-only default, panic clear, inactivity auto-clear, encrypted export only |
| PII leaking via analytics/error reports | No analytics Phase 1; allowlist-only error capture; no transmission |
| Maintenance burden as scope grows | Modular architecture; data-driven adapters; community contribution model |

## 14. Decisions Log

| # | Date | Question | Decision | Reason |
|---|---|---|---|---|
| Q1 | 2026-07-02 | Household model | Shared roster + per-member attributes; each program derives its own household. | Program household definitions differ; one model would produce wrong results. |
| Q2 | 2026-07-02 | Income modeling | `incomeSources[]` typed earned/unearned as source of truth; derive gross. | Fixes SNAP 20% earned-income deduction; avoids part/whole mismatch. |
| Q3 | 2026-07-02 | Status tracking vs privacy | No server tracking Phase 1; optional local encrypted progress file + printable checklist. | Reconciles tracking with privacy on shared devices. |
| Q4 | 2026-07-02 | Alaska/Hawaii FPL | `calculateFpl` takes a region; bundle contiguous/AK/HI tables. | FPL differs for AK/HI; size-only calc would be wrong. |
| Q5 | 2026-07-02 | Pilot states | Ohio, Texas, Washington. | Cover expansion/non-expansion/integrated/BBCE; Ohio adds Franklin County SMEs + reach. |
| Q6 | 2026-07-02 | Outcome semantics | Deterministic, cautious rules; never `ineligible` if a pathway exists; reserve `eligible` for verified. | Prevents harmful false negatives; keeps engine transparent. |
| Q7 | 2026-07-02 | Rule data lifecycle | Versioned bundled JSON + `dataVersion`; annual seed refresh; offline via app-update cache-bust. | Keeps data current without a live dependency. |
| Q8 | 2026-07-02 | Reasoning i18n | Engine returns reason codes + params; UI localizes. | Keeps engine pure and translation-ready. |
| Q9 | 2026-07-02 | Dashboard vs auth | Phase 2 dashboard local-only, no accounts; Cognito in Phase 3. | Resolves roadmap conflict; preserves privacy model. |
| Q10 | 2026-07-02 | PII + UPL + referral | Enumerate PII, session-only, disclaimer, no PII analytics; plus legal referral + reviewable export bundle. | Mitigates UPL/privacy risk; connects users to real help. |
| Q11 | 2026-07-02 | PDF MVP scope | Phase 1 = SNAP + Medicaid for Ohio; generic summary sheet elsewhere. | Bounds unbounded per-state form work; always gives users something usable. |
| Q12 | 2026-07-02 | `county` usage | Keep for local routing/links + future variation; not Phase 1 math. | Useful later; harmless now. |
| Q13 | 2026-07-02 | Non-functional targets | WCAG 2.2 AA; ES2019; ≤250KB gz; <5s TTI mid Android; offline after first load. | Makes "works for target users" testable. |
| Q14 | 2026-07-02 | SNAP minimum benefit | Federal minimum ($23 for 1–2 person) as yearly config in the formula. | Correct benefit estimate at the low end. |
| Q15 | 2026-07-02 | Missing program in adapter | Show `unknown` + "not yet supported" + official link; never omit. | Transparency; avoids implying ineligibility. |
| Q16 | 2026-07-02 | Referral privacy + transparency | Static directory; local bundle exported by user; explicit consent; always-on plain-language data transparency. | Protects PII; builds trust for low-literacy users. |
| Q17 | 2026-07-02 | Eligibility status model | Per-member `eligibilityStatus` enum; never disqualify on status alone; status-blind rules for children/pregnant; `prefer_not_to_say`. | Boolean misclassifies categories and harms trust; protects mixed-status households. |
| Q18 | 2026-07-02 | Income normalization + self-employment | Per-source amount+frequency normalized to monthly (standard factors); self-employment net; derived gross. | Monthly budgeting with USDA/SSA-standard factors keeps math correct. |
| Q19 | 2026-07-02 | Uncomputable criteria scope | WIC caps at `possibly_eligible`; Medicaid MAGI-only with non-MAGI note; ABAWD flagged not disqualifying. | Engine must not output a hard "no" on things it can't compute. |
| Q20 | 2026-07-02 | Encryption + key handling | Passphrase → PBKDF2 → AES-GCM on-device; no stored key; no recovery; downloaded-file default. | Standard, offline, dependency-free; honest privacy tradeoff. |
| Q21 | 2026-07-02 | Correctness assurance | Golden fixtures in CI + SME sign-off gate; draft/unverified state; Ohio via Franklin County. | Wrong benefits math harms people; fixtures + human review is the guardrail. |
| Q22 | 2026-07-02 | Vehicle assets | Defer valuation; keep config flag; flag `VEHICLE_ASSET_MAY_APPLY` near asset limit. | Rules are complex/state-variable; flagging beats wrong disqualification. |
| Q23 | 2026-07-02 | `fplRegion` | Derived from `stateCode` via helper; kept as populated field. | Region is a function of state; removes contradiction + redundant question. |
| Q24 | 2026-07-02 | Age vs birthdate | DOB preferred (months for under-2s) at snapshot `evaluationDate`; age fallback flags boundary cases. | Exact boundary math + reproducibility; keeps low-friction/privacy path. |
| Q25 | 2026-07-02 | Reason-code locale fallback | locale → English → humanized; English enforced in CI; "not yet translated" indicator. | Always meaningful text; English as source of truth; async translations. |
| Q26 | 2026-07-02 | Shared-device hygiene | Panic clear + inactivity auto-clear (with warning) + memory-only default; timeout configurable. | Shared devices are core; closes the lingering-data gap. |
| Q27 | 2026-07-02 | Referral vetting + Terms | Legal-aid/gov-first, published no-fee firm standard, no-endorsement disclaimer, app-wide Terms; counsel review before launch. | Minimizes cost + liability; makes directory defensible. |
| Q28 | 2026-07-02 | Data provenance | Structured `sources[]` for required values; federal provenance + `effectiveDate`; validated in CI; part of SME gate. | Makes verification an auditable checklist; annual updates re-checkable. |
| Q29 | 2026-07-02 | Update calendar | Scheduled Jan (FPL) + Oct (SNAP) refreshes with SME re-verify; staleness caveat; release-based delivery. | Predictable cadence; prevents silent drift; stays offline. |
| Q30 | 2026-07-02 | Dead-end handling | No bare dead-end: explain + referrals + 211/local + export. | Mission + cautious principle require a next step, not a wall. |
| Q31 | 2026-07-02 | Returning-user resume | Explicit encrypted-file re-import only; no auto-restore; `dataVersion` stale-check. | Only model consistent with memory-only + no-accounts + encryption. |
| Q32 | 2026-07-02 | Hosting + analytics | S3+CloudFront via GitHub Actions; no user analytics Phase 1; CloudWatch infra only. | Matches offline-first static app; strongest launch privacy posture. |
| Q33 | 2026-07-02 | Crash/error reporting | No third-party reporting Phase 1; allowlist-only if ever added; no transmission; React error boundary. | Only way the privacy promise holds under error conditions. |
| Q34 | 2026-07-02 | Reading level + numeric help | 6th–8th grade target with Flesch–Kincaid CI check; inline numeric help + flexible formats. | Makes "plain language" testable; reduces numeric-literacy errors in income data. |
| Q35 | 2026-07-02 | Org deployment | Hosted primary + documented self-host + minimal per-deployment config; defer white-label to Phase 2. | Zero burden on under-resourced orgs while keeping self-hosting open. |
| Q36 | 2026-07-02 | Income/employment attribution | Optional `memberId` on income; per-member `employmentStatus`; cautious downgrade when unattributed. | Minimum structure enabling MAGI household derivation + per-adult ABAWD; keeps simple path. |
| Q37 | 2026-07-02 | Per-person vs per-program results | Medicaid/CHIP/WIC return per-member outcomes + a most-encouraging rollup; SNAP/LIHEAP/TANF stay household-scoped. | Eligibility genuinely varies by person (kids eligible, parents not); one outcome would misrepresent the common case. |
| Q38 | 2026-07-02 | FPL basis | FPL computed per program (household size per program rules; pregnancy counts as 2+). | Household size and FPL% differ by program; one shared number would be wrong. |
| Q39 | 2026-07-02 | Required-input table | Defined per-program required vs optional inputs; missing required → `possibly_eligible`. | Gives the engine a deterministic downgrade rule and tells intake what's mandatory. |
| Q40 | 2026-07-02 | Program evaluation order | Evaluate every program independently; adjunctive eligibility from actual-receipt flags only, not computed results. | Simpler, predictable engine; avoids cascading errors and order dependence. |
| Q41 | 2026-07-02 | Operating modes | Two modes: individual (shared-device hygiene) and navigator (batch, navigator-controlled retention). | Kiosk auto-clear and batch screening have opposite retention needs. |
| Q42 | 2026-07-02 | Residency | Selecting a state is a recorded attestation of residency; assumed satisfied unless the user indicates otherwise. | Programs require residency; state selection is the natural low-friction signal. |
| Q43 | 2026-07-02 | PDF language | Generate the English official application plus a language-specific companion guide. | Official forms exist only in English; the guide keeps non-English users able to complete/submit. |

> ASSUMPTION: Washington accepted as the third pilot state (user did not object). Revisit if the
> Franklin County partnership suggests a different comparison state.
> OPEN DEPENDENCY: The referral directory and Terms of Use posture (Q27, 5.13) require review by
> qualified legal counsel before public launch.

## 15. Build-Readiness Checklist

- [x] No open Blocker, Major, or Minor items (Q1–Q43 resolved).
- [x] Every acceptance criterion is testable and free of undefined terms.
- [x] Every entity/field has a type; household, income, age, status, and result-scope models resolved.
- [x] Income normalization and member attribution defined.
- [x] Per-person vs household result scope, per-program FPL, required-input table, program independence,
      operating modes, residency, and PDF-language rules defined.
- [x] Reference-data source, provenance, and update lifecycle defined.
- [x] Outcome semantics deterministic and documented, tuned cautious.
- [x] Scope boundaries (in/out) explicit, including deferred program complexity.
- [x] Privacy/PII, shared-device hygiene, encryption, disclaimers, and referral/consent defined.
- [x] Correctness-assurance process (fixtures + SME sign-off) defined.
- [x] Non-functional requirements (privacy, transparency, offline, performance, accessibility,
      readability, i18n) pinned down.
- [x] Two last-pass sweeps performed; nothing material outstanding.
- [ ] Pre-launch (not build-blocking): legal counsel review of referral/Terms posture.

## 16. Next Steps

1. Produce `design.md` (architecture, module boundaries, data flow, MAGI household-derivation algorithm,
   reason-code catalog, encryption + saved-file format, PDF strategy, referral/consent flow, intake flow).
2. Produce `tasks.md` (incremental, test-driven implementation plan for Phase 1).
