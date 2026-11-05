# OpenBridge — Implementation Plan (Phase 1)

> Tasks for the Phase 1 scope in `requirements.md` (v4) and `design.md`. Sequenced engine-first:
> the pure eligibility engine and its golden fixtures land before any UI, because correctness is
> the project's highest-leverage risk. Each task is test-driven — write or update tests with the
> code, and every task should leave the build green. Requirement references point at
> `requirements.md` sections.

## 1. Monorepo scaffold and tooling

- [x] 1.1 Initialize the Turborepo workspace with the package layout from design §2.1
  (`packages/shared`, `eligibility-engine`, `form-assembly`, `web-app`, `org-dashboard`; `data/`,
  `scripts/`, `infra/`, `docs/`).
- [x] 1.2 Configure TypeScript project references, `tsconfig.base.json` (ES2019 target), ESLint,
  Prettier, and Vitest at the root; enforce the one-way dependency direction with lint rules.
  _Requirements: 8 (non-functional targets)_
- [x] 1.3 Add CI skeleton (GitHub Actions): install → lint → typecheck → test → build. Wire an empty
  readability-check and adapter-validation step to be filled in later.
  _Requirements: 5.6.4, 5.14_

## 2. Shared package (types + primitives)

- [x] 2.1 Implement the core types from requirements §10 in `shared` (`HouseholdMember`,
  `IncomeSource`, `HouseholdProfile`, `EligibilityOutcome`, `ReasonCode`, `FactorRow`,
  `MemberEligibility`, `ProgramEligibilityResult`, `EligibilityResult`, `StateAdapter`,
  `ProvenanceSource`, `ReferralEntry`, `DeploymentConfig`, `AppMode`, enums).
  _Requirements: §10 data models_
- [x] 2.2 Implement integer-cent currency utilities and locale-agnostic date/age helpers (age in
  years and months at a snapshot date); unit-test rounding and boundary ages.
  _Requirements: §7 (age rule), 3.4 design (integer cents)_
- [x] 2.3 Define reason-code key constants and category metadata in `shared/reason-codes.ts`
  (no English strings here — keys only).
  _Requirements: 5.9.3, design §3.6_

## 3. Eligibility engine — foundations

- [x] 3.1 Implement `regionForState()` and `calculateFpl(householdSize, region)` against the three
  FPL tables; unit-test contiguous/AK/HI and household-size scaling.
  _Requirements: §7 (FPL basis), 5-Q23/Q4_
- [x] 3.2 Implement `normalizeMonthly(source)` with the Q18 conversion factors and derived
  `grossMonthlyIncome`; unit-test each frequency and hourly×hours.
  _Requirements: §7 (income model), 5.2_
- [x] 3.3 Implement the shared `decideOutcome()` ladder enforcing the cautious rules (never
  `ineligible` on status alone, near-threshold/missing/uncomputable → `possibly_eligible`); unit-test
  every branch.
  _Requirements: 5.1.3–5.1.6, §7 (outcome selection)_
- [x] 3.4 Implement household-derivation helpers: SNAP unit (with separate purchase/prepare toggle) and
  the MAGI household algorithm from design §3.3 (filer/dependent/non-filer + pregnancy count), including
  the ambiguity → `possibly_eligible` downgrade. Unit-test single-family, multi-generational, and
  mixed-filer cases.
  _Requirements: 5.2.2, §7 (household model), design §3.3_

## 4. Eligibility engine — program evaluators

- [x] 4.1 Implement `evaluateSnap` (gross/net tests, BBCE waivers, deductions, categorical eligibility
  via actual receipt, benefit estimate floored at the minimum benefit, ABAWD flag, vehicle-asset
  caveat). Unit-test threshold boundaries and BBCE vs non-BBCE.
  _Requirements: §7 (SNAP), 5.1, Q14/Q22/Q40_
- [x] 4.2 Implement `evaluateMedicaid` as a **per-member** evaluator (MAGI pathways only, expansion vs
  non-expansion, tiered child limits, pregnancy, non-MAGI "other pathways" note, per-member outcomes +
  most-encouraging rollup). Unit-test kids-eligible/parents-not in a non-expansion state.
  _Requirements: 5.1.9, §7 (Medicaid), Q37_
- [x] 4.3 Implement `evaluateWic` as a **per-member** evaluator (185% FPL, adjunctive via actual
  receipt, categories, no status test, cap at `possibly_eligible` for clinic risk). Unit-test category
  detection and the cap.
  _Requirements: 5.1.9, §7 (WIC), Q19/Q37_
- [x] 4.4 Implement `evaluateLiheap` and `evaluateTanf` (household-scoped; state-variable limits;
  categorical if on SNAP; TANF dependent-child requirement). Unit-test with adapter configs.
  _Requirements: §6, §7 (LIHEAP/TANF)_
- [x] 4.5 Implement the `evaluateEligibility` orchestrator: normalize → resolve program set (missing →
  `unknown`) → run evaluators independently → assemble `EligibilityResult` with per-program
  `fplCalculation` and `evaluationDate`/`dataVersion`. Unit-test program independence and missing-program
  handling.
  _Requirements: 5.1.1, 5.10.3, §7 (program independence/FPL basis), Q38/Q40_
- [x] 4.6 Add the required-input downgrade logic per §7.1 (missing required input →
  `possibly_eligible`; missing member income attribution → `RESULT_LIMITED_BY_MISSING_INCOME_ATTRIBUTION`).
  _Requirements: 5.1.4, 5.2.3, §7.1, Q39_

## 5. Reference data and state adapters

- [x] 5.1 Author `data/federal/` FPL tables (contiguous/AK/HI) and SNAP allotments/deductions with
  provenance sources and `effectiveDate`/`expectedRefreshDate`; write `scripts/seed-fpl-data.ts`.
  _Requirements: 5.15, §4.3 design, Q28/Q29_
- [x] 5.2 Implement `scripts/validate-state-adapter.ts` (Zod schema + required provenance + fixtures
  pass) and wire it into CI.
  _Requirements: 5.10, 5.14.4, Q28_
- [x] 5.3 Author the **Ohio** adapter (expansion + integrated) with provenance and a `fixtures/` set;
  mark `verificationStatus` pending SME sign-off; leave a clear place for Franklin County review.
  _Requirements: 5.10, 5.14, Q5/Q21_
- [x] 5.4 Author the **Texas** (non-expansion, non-BBCE, asset test) and **Washington** (expansion +
  BBCE) adapters with provenance and fixtures.
  _Requirements: 5.10, 5.14, Q5_
- [x] 5.5 Wire the golden-fixture runner into CI so engine output is asserted against every adapter's
  fixtures and divergence fails the build.
  _Requirements: 5.14.1–5.14.2, Q21_

## 6. Web app — shell, i18n, stores

- [x] 6.1 Scaffold the `web-app` React + Vite PWA with routing (`/`, `/screen`, `/results`,
  `/program/:id`, `/help`, `/resume`) and the app shell.
  _Requirements: 5.8, design §5.1_
- [x] 6.2 Set up `react-i18next` with en/es bundles and implement `renderReason()` with the
  locale → English → humanized fallback and `Intl` currency/number formatting; add the CI check that
  every engine reason key has an English string.
  _Requirements: 5.9, Q8/Q25_
- [x] 6.3 Implement the memory-only Zustand stores (`intakeStore`, `resultStore`, `sessionStore`) and
  the `loadAdapter()`/federal-data loading seam.
  _Requirements: 5.5.2, design §5.3_

## 7. Web app — intake and results

- [x] 7.1 Build the intake wizard screens with progressive disclosure/branching per design §5.2
  (location + residency attestation; household builder; per-member attributes incl. `eligibilityStatus`;
  income with member attribution when >1 adult; optional expenses/assets/receipt; optional MAGI tax
  questions; review). Validate with Zod at the boundary.
  _Requirements: 5.1, 5.2, 5.6.5, §7.1, Q17/Q36/Q42_
- [x] 7.2 Build the results screen: per-program cards, per-member breakdown for Medicaid/CHIP/WIC,
  localized reasoning/factors, and the no-dead-end state (explain + referrals + 211/local + export).
  _Requirements: 5.1.2, 5.1.8, 5.1.9, Q30/Q37_
- [x] 7.3 Build the program-detail view (factors, next steps, required documents, apply URL, freshness
  caveat when data is stale).
  _Requirements: 5.1.2, 5.15.2_

## 8. Web app — privacy, modes, transparency

- [x] 8.1 Implement the always-visible data-transparency banner (plain language + icons, "only on this
  device") on every data-collecting screen.
  _Requirements: 5.6.1–5.6.3, Q16_
- [x] 8.2 Implement the "Clear my data / Start over" panic control and individual-mode inactivity
  auto-clear with the accessible "are you still there?" warning.
  _Requirements: 5.7, Q26_
- [x] 8.3 Implement mode selection and navigator-mode behavior (batch `dashboardStore`, "next
  client"/"clear client", manual lock instead of auto-clear); feature-flag the dashboard route.
  _Requirements: 5.11, 5.16, Q41_
- [x] 8.4 Add the readability CI check (Flesch–Kincaid on `locales/en/*.json`) targeting 6th–8th grade,
  and numeric-input help/flexible formats.
  _Requirements: 5.6.4–5.6.5, Q34_

## 9. Web app — save, export, resume (encryption)

- [x] 9.1 Implement the WebCrypto save module (passphrase → PBKDF2 → AES-GCM) producing the
  `openbridge.save.v1` envelope; unit-test encrypt/decrypt round-trip and wrong-passphrase handling.
  _Requirements: 5.5.3, Q20_
- [x] 9.2 Implement save/download and the `/resume` import flow with the `dataVersion` stale-check and
  friendly error messaging; no auto-restore.
  _Requirements: 5.4.2–5.4.5, Q31_

## 10. Form assembly

- [x] 10.1 Build the generic **application summary sheet** PDF (all entered data + outcomes + next
  steps) via `@react-pdf/renderer`, tagged for accessibility.
  _Requirements: 5.3.2, 5.6, design §7_
- [x] 10.2 Build the **Ohio SNAP and Medicaid** pre-filled PDF templates from a data-driven field
  mapping (English), matching the Ohio Benefits layout.
  _Requirements: 5.3.1, Q11/Q43_
- [x] 10.3 Build the **language companion guide** generator (localized, for non-English sessions).
  _Requirements: 5.3.3, Q43_
- [x] 10.4 Build the **review bundle** (PDFs + summary) with plain and passphrase-encrypted export
  options.
  _Requirements: 5.12.3, Q10_

## 11. Referrals, consent, and Terms

- [x] 11.1 Author `data/referrals/` entries (legal aid / gov / bar / firm) with coverage/category/
  language fields for the pilot states, including immigration-focused legal aid.
  _Requirements: 5.12.1, Q17/Q27_
- [x] 11.2 Build the referral/help screen with state/county + category filtering, device-native
  `tel:`/`mailto:` contact, and the no-endorsement disclaimer.
  _Requirements: 5.12.1–5.12.2, 5.12.5_
- [x] 11.3 Implement the explicit pre-export consent screen and the bundle privacy notice; add the
  app-wide Terms of Use (first-run acknowledgment + footer).
  _Requirements: 5.12.4, 5.13_

## 12. Offline / PWA

- [x] 12.1 Configure the Vite PWA/Workbox service worker: precache app shell, locales, adapters, and
  federal data; `CacheFirst` keyed to `dataVersion` for data, `StaleWhileRevalidate` for assets; add
  the update-available prompt.
  _Requirements: 5.8, Q7_
- [x] 12.2 Implement the stale-data freshness banner driven by `expectedRefreshDate`.
  _Requirements: 5.15.2, Q29_

## 13. End-to-end and accessibility tests

- [x] 13.1 Write Playwright E2E: full intake → results → PDF → save → resume → clear, in both modes and
  en/es, plus an offline run after first load.
  _Requirements: 5.1, 5.3, 5.4, 5.7, 5.8, 5.16_
- [x] 13.2 Add axe automated accessibility checks in CI and a documented manual screen-reader pass
  checklist.
  _Requirements: 5.6, 8 (WCAG 2.2 AA)_

## 14. Deployment

- [x] 14.1 Write the AWS CDK stacks in `infra/` (private S3 + OAC, CloudFront with HTTPS and SPA
  rewrite, CloudWatch infrastructure metrics only — no user analytics). _Verified via `cdk synth`._
  _Requirements: 8 (hosting), 5.5.6, Q32_
- [x] 14.2 Extend the GitHub Actions pipeline to build and deploy the hosted instance on the main branch;
  publish the static `DeploymentConfig` asset and document self-hosting in `docs/DEPLOYMENT.md`.
  _CI workflow written (guarded on OIDC secret); no live deploy performed (needs credentials)._
  _Requirements: 5.16, Q32/Q35_

## 15. Docs and launch-readiness

- [x] 15.1 Write `docs/PRIVACY_MODEL.md` (PII inventory, data lifecycle), `docs/STATE_ADAPTERS.md`
  (schema, fixtures, provenance, verification/sign-off), and `CONTRIBUTING.md`/`SECURITY.md`
  (adapter contribution, English-base-locale rule, allowlist error policy).
  _Requirements: 5.5, 5.9.4, 5.14, 5.10, Q25/Q28/Q33_
- [x] 15.2 Prepare the legal-counsel review package for the referral/Terms posture (open dependency,
  not build-blocking) and the SME sign-off record for the Ohio adapter.
  _Review package and sign-off template prepared. Legal review and Franklin County sign-off are
  still **pending**; see `docs/LEGAL_REVIEW.md` and `docs/SME_SIGNOFF.md` and `ROADMAP.md`._
  _Requirements: 5.13.2, 5.14.3, Q21/Q27_

---

### Sequencing notes

- Sections 1–5 deliver a **fully tested, headless eligibility engine** with three schema-validated
  (still `draft`, pending SME sign-off) state adapters before any UI exists — this front-loads the correctness work.
- Sections 6–9 build the privacy-critical PWA around the engine; 10–11 add documents and referrals;
  12–13 harden offline and quality; 14–15 ship and document it.
- Task 15.2 is the one non-code, non-blocking item carried from the Decisions Log (legal review + SME
  sign-off) — track it but it does not gate the build.
