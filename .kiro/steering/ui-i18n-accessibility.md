---
inclusion: fileMatch
fileMatchPattern:
  [
    'packages/web-app/src/**',
    'packages/web-app/e2e/**',
    'packages/form-assembly/**',
    'packages/rule-toolkit/src/**',
    'packages/rule-toolkit/e2e/**',
  ]
---

# UI, language, and accessibility standards

## Plain language

- Target 6th to 8th grade. `npm run check:readability` measures English UI copy (target 8 or lower);
  do not let it rise.
- Short sentences. Common words. Second person ("you", "your household").
- Say what to do, not what went wrong: "Enter how much you earn each month" beats "Invalid input".
- Give examples for numbers ("for example, 1,250") and accept `$`, commas, and decimals.
- Results never sound final or judgmental. Use "likely", "may", and "might" honestly, and always
  give a next step.
- No em dashes or emoji in user-facing copy. Use commas, colons, or parentheses.

## Internationalization

- Every user-facing string goes through i18next. No hardcoded copy in components or PDFs.
- English (`locales/en/*.json`) is the base locale and must be complete. Add Spanish
  (`locales/es/*.json`) in the same change when you can; missing Spanish falls back to English.
- Keys are stable and descriptive (`intake.income.amountHelp`), never the English text itself.
- Format money, numbers, and dates with `Intl` through the existing helpers and `renderReason()`.
- Do not concatenate translated fragments; use interpolation so word order can change.
- Official forms stay English; non-English sessions get the localized companion guide.

## Accessibility (WCAG 2.2 AA)

- Semantic HTML first: real `button`, `a`, `label`, `fieldset`/`legend`, headings in order.
- Every input has a visible label and an associated error message (`aria-describedby`).
- Full keyboard operation, visible focus, logical focus order. Move focus to the step heading on
  each wizard step.
- Touch targets at least 44 by 44 CSS pixels. Text contrast at least 4.5:1.
- Status changes (transparency banner, auto-clear warning, results) are announced
  (`role="status"`, `role="alertdialog"` as appropriate).
- Respect `prefers-reduced-motion`. Works at 200% zoom and 320 px width.
- Generated PDFs are tagged and have a logical reading order.
- Automated axe checks run in `npm run e2e`; they are necessary but not sufficient. For notable UI
  changes, walk through `docs/ACCESSIBILITY_CHECKLIST.md` and say in the PR which items you checked.
  Do not claim WCAG conformance from automated checks alone.
