---
inclusion: always
---

# Product context

Canonical rules live in `AGENTS.md`. This file gives the product context every change needs.

## Mission

Help people get the public benefits they already qualify for. The barrier is not that programs are
missing. It is that the path in is fragmented, confusing, and exhausting. OpenBridge connects the
dots: answer once, check every program, understand every result, leave with a next step.

## Users (design for the hardest case first)

- **Benefit seekers.** Often low-literacy or low-tech, often not English-first, often on a shared
  library computer or an older Android phone, sometimes in a mixed-status household that is afraid
  of being exposed. Assume stress, limited time (about 30 minutes), and low trust.
- **Navigators.** Caseworkers and volunteers screening many clients in a row. They need speed and
  a clean hand-off between clients.
- **Contributors.** Developers, policy experts, translators maintaining rules and copy.

## Product principles (in priority order)

1. **Do no harm.** A false "you don't qualify" can end someone's search for good. Prefer
   "possibly eligible" with an honest explanation over a confident wrong answer.
2. **Privacy by architecture.** Nothing leaves the device. Trust is earned by design, not policy.
3. **Radical transparency.** Every screen says what data exists and where. Every result shows its
   reasons and factors.
4. **Plain language.** 6th to 8th grade reading level. Short sentences, concrete words, examples.
5. **No dead ends.** Every path ends in an action: apply, save, get help, or start over.
6. **Augment humans.** OpenBridge helps people and navigators. It does not decide, file, or advise.

## Scope boundaries

In scope (Phase 1): screening for SNAP, Medicaid (MAGI pathways), CHIP (via Medicaid child tiers),
WIC; early LIHEAP and TANF; Ohio, Texas, Washington; English and Spanish; pre-filled documents;
encrypted local save; referrals.

Out of scope unless the spec changes: submitting applications, integrating with agency systems,
legal advice, accounts, server-side storage, analytics, non-MAGI Medicaid, WIC nutritional-risk
determination, SNAP ABAWD computation, vehicle-asset valuation.

## Status honesty

All state adapters are `draft` and unverified. Any copy, README, or doc an agent writes must not
imply results are authoritative, that the app is launched, or that expert sign-off happened.
