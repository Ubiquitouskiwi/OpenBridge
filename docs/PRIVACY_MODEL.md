# OpenBridge Privacy Model

OpenBridge is privacy-first by architecture (requirements §3, §5.5–5.7). This document is the
authoritative description of what data exists, where it lives, and how it is protected.

## Principles

1. **Client-first computation.** All eligibility logic runs in the browser. In Phase 1 there is no
   backend and no personal data ever leaves the device unless the user explicitly exports it.
2. **Memory-only by default.** Personal data lives in in-memory application state (Zustand). It is
   not written to `localStorage`, `IndexedDB`, cookies, or browser autofill.
3. **Radical transparency.** Every data-collecting screen states, in plain language, that the
   information is only on the device and has not been sent anywhere.
4. **No analytics in Phase 1.** No user analytics are collected. Only infrastructure metrics
   (CloudWatch) would exist when hosted on AWS, and they never contain personal data.

## PII inventory

Collected during a screening session (in memory only):

| Field                              | Sensitivity | Notes                                                                                   |
| ---------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| Household members' ages            | Medium      | Used for age-based eligibility. Date of birth is optional (more exact for age cutoffs). |
| Relationships                      | Low         | Used to derive program households.                                                      |
| Pregnancy / disability flags       | High        | Drive WIC/Medicaid rules.                                                               |
| Immigration/eligibility status     | High        | Optional; "prefer not to say" supported. Never disqualifies alone.                      |
| Income (amounts, types, frequency) | High        | Self-reported; used for income tests.                                                   |
| Expenses, assets                   | Medium      | Optional; improve accuracy.                                                             |
| County / state                     | Low–Medium  | State selection is a residency attestation.                                             |

**Not collected during screening:** names, SSNs, addresses, contact details. Date of birth is
optional; age alone is enough. (Official
applications may ask for these separately, on the agency's own site.)

## Data lifecycle

- **During a session:** data is held in memory and reflected in the transparency banner.
- **Clearing:** the always-visible "Clear my data / Start over" control and the inactivity
  auto-clear (individual mode) wipe all in-memory state.
- **Saving (opt-in):** the user may export an encrypted progress file (see below). Nothing is
  saved unless the user chooses to.
- **Navigator mode:** sessions are retained in memory under the navigator's control for the active
  session; still no disk persistence unless exported.

## Encryption

Saved progress and encrypted export bundles use WebCrypto:

- Passphrase → **PBKDF2** (SHA-256, 310,000 iterations, per-file random salt) → **AES-GCM**
  (per-encryption random IV).
- The key is **never stored**. There is **no recovery**: a forgotten passphrase means re-entering
  data. This tradeoff is stated to the user before they rely on it.
- Envelope format: `openbridge.save.v1` (see `packages/web-app/src/lib/crypto.ts`).

## Error handling

- No third-party client error reporting in Phase 1; nothing is transmitted.
- If error capture is ever added it must be **allowlist-based** (error type, stack, non-PII app
  state only) and must never include form values, the household profile, or reason-code parameters.

## Referrals

- The referral directory is static, bundled data; building it sends no user data.
- Contact is device-native (`tel:`/`mailto:`), never server-mediated.
- Any export of a review bundle requires an explicit consent step and carries a privacy notice.

## Optional components with a different data path

- **MCP server for AI agents** (`packages/mcp-server`, ADR-0003). It is separate from the web app
  and does not change anything above. It receives household details from an AI agent, keeps them
  in memory for one request, and never logs, stores, or forwards them. The details do pass through
  the AI app and its model provider, which the server's README explains to users.
- **Single-file local download** (ADR-0004). It runs entirely from a file on the user's computer,
  makes no network requests, and keeps the same memory-only and encrypted-save behavior.
