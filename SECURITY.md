# Security Policy

OpenBridge handles sensitive personal information (income, household, immigration status) for people
in vulnerable situations. Security and privacy are core requirements, not afterthoughts.

## Hard rules

1. **No off-device transmission of personal data in Phase 1.** All computation is client-side. Do
   not add network calls that send the household profile, income, status, or results anywhere.
2. **Memory-only by default.** Do not persist personal data to `localStorage`, `IndexedDB`, cookies,
   or autofill. The only persistence is the user-initiated, passphrase-encrypted export file.
3. **Allowlist error reporting.** No third-party client error reporting ships in Phase 1. If any is
   added later, it must capture only an allowlist of non-PII fields (error type, stack, safe app
   state). Never capture form values, the profile, or reason-code parameters.
4. **No PII in analytics.** Phase 1 ships no user analytics. Any future analytics must be aggregate
   and anonymous.
5. **Encryption.** Saved/exported data uses WebCrypto PBKDF2 (SHA-256) + AES-GCM with no stored key
   and no recovery. Do not weaken these parameters or add a key-escrow mechanism.

## Shared-device assumptions

The app is used on library and shared devices. Preserve the panic "Clear my data" control and the
inactivity auto-clear. Any feature that could leave data behind for the next user is a security bug.

## Dependencies

Pin dependency versions and prefer well-known, maintained packages. Run `npm audit` and review
findings; do not apply `--force` fixes without checking for breaking changes.

## Reporting a vulnerability

Use GitHub's **private vulnerability reporting** (the "Report a vulnerability" button on the
repository's Security tab). Do not open a public issue with exploit details. Include steps to
reproduce and the potential impact, especially any path that could expose personal data. If you
cannot use GitHub reporting, email [openbridge@starlingtek.com](mailto:openbridge@starlingtek.com)
with "SECURITY" in the subject.

Maintainers aim to acknowledge reports within 5 business days and to share a remediation plan
within 30 days. Reporters who wish to be credited will be acknowledged in the release notes.

## Supported versions

OpenBridge is pre-release. Only the latest commit on `mainline` receives security fixes.
