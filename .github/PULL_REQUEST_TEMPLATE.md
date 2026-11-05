## Summary

<!-- What changed and why, in two or three sentences. -->

## Traceability

- Issue: #
- Requirements / decisions served: <!-- e.g. 5.1.4, Q17, ADR-0003 -->

## Type of change

- [ ] Bug fix
- [ ] Feature
- [ ] Eligibility rule or reference data (`data/`)
- [ ] Docs or standards
- [ ] Tooling, CI, or infrastructure

## Verification

<!-- Paste the commands you ran and their results. Say plainly if something could not run. -->

- [ ] `npm run verify` passes
- [ ] `npm run e2e` passes (required for UI changes)
- [ ] Tests added or updated, and they fail without this change

## Safety checklist

- [ ] No personal data can leave the device (no new network calls, storage, analytics, or logging of user data)
- [ ] The engine stays pure, and the cautious-outcome rules are unchanged (or an ADR is linked)
- [ ] Every new or changed rule value cites a source in `sources[]`; `verificationStatus` stays `draft`
- [ ] New user-facing text goes through i18n, reads at or below 8th grade, and has no em dashes or emoji
- [ ] UI changes keep keyboard, focus, labels, and contrast working
- [ ] `CHANGELOG.md` updated under `Unreleased` (if user-visible)

## AI assistance

- [ ] This PR was written or substantially drafted by an AI agent: <!-- name the agent/model -->
- [ ] A human has read every line of the diff

## Notes for reviewers

<!-- Assumptions, open questions, risks, follow-ups. -->
