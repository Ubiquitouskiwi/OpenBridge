# Legal Review Package (pre-launch)

> Status: **OPEN DEPENDENCY — not build-blocking.** Per the spec (requirement 5.13.2, Q27), the
> referral and Terms-of-Use posture must be reviewed by qualified legal counsel before public
> launch. This document is the package for that review.

## What we are asking counsel to review

1. **Unauthorized practice of law (UPL) boundary.** OpenBridge helps users _complete government
   benefit forms_ and screens eligibility. It does not give legal advice or file on a user's behalf.
   Confirm the framing and disclaimers keep us on the right side of UPL rules in the pilot states
   (OH, TX, WA).
2. **Terms of Use / limitation of liability.** See `packages/web-app/src/routes/Terms.tsx`. Confirm
   the plain-language Terms adequately cover: not-legal-advice, no warranty, limitation of liability,
   and that results are estimates, not decisions.
3. **Referral directory.** See `data/referrals/directory.json` and
   `packages/web-app/src/features/referrals/HelpView.tsx`. We lead with nonprofit legal aid and
   government resources; any private firm must meet a published, no-fee inclusion standard. Confirm
   the no-endorsement / not-responsible language and the no-paid-placement policy are sufficient.
4. **Data handling representations.** Confirm the privacy statements in the UI and
   `docs/PRIVACY_MODEL.md` accurately and defensibly describe the memory-only, no-transmission model.
5. **Licensing.** Intended license is AGPL-3.0-only. Confirm the license choice and any contributor terms (DCO or CLA) before publishing.

## Materials

- Requirements, design, decisions log: `.kiro/specs/openbridge/`
- Privacy model: `docs/PRIVACY_MODEL.md`
- Terms of Use (source): `packages/web-app/src/routes/Terms.tsx`
- Referral directory + inclusion approach: `data/referrals/`, `docs/STATE_ADAPTERS.md`

## Sign-off

| Reviewer  | Role          | Scope                          | Date | Outcome |
| --------- | ------------- | ------------------------------ | ---- | ------- |
| _pending_ | Legal counsel | UPL, Terms, referral liability | —    | —       |

Launch is blocked on a recorded "approved" outcome here.
