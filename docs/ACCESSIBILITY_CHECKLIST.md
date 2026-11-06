# Manual Accessibility Checklist

Automated axe checks (`e2e/a11y.spec.ts`) catch many issues, but full WCAG 2.2 AA conformance
requires manual testing with assistive technology. Before each release, verify:

## Keyboard

- [ ] Every interactive element is reachable and operable with Tab / Shift+Tab / Enter / Space.
- [ ] Focus order matches the visual order through the intake wizard.
- [ ] Visible focus indicator on all controls.
- [ ] The "Skip to content" link works.

## Screen reader (VoiceOver / NVDA)

- [ ] Each form control announces its label and current value.
- [ ] Wizard step changes are announced.
- [ ] The transparency banner and auto-clear warning are announced (role=status / alertdialog).
- [ ] Result outcomes and reasons are read in a sensible order.

## Low vision / zoom


- [ ] Layout works at 200% zoom and 320px width with no loss of content.
- [ ] Color contrast meets AA (text >= 4.5:1).

## Content

- [ ] Copy reads at or below an 8th-grade level (see `npm run check:readability`).
- [ ] Numeric inputs have examples and accept `$`/commas.
- [ ] Error messages are specific and programmatically associated with fields.

## Motion / timing

- [ ] Inactivity auto-clear shows a warning with enough time to respond.
- [ ] Respect `prefers-reduced-motion`.
