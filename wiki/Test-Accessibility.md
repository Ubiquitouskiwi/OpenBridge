# Test accessibility

This page shows you how to check that OpenBridge works for people with disabilities, and how to
report what you find. You can help with or without assistive technology such as a screen reader.
You do not need to write code.

## Why people matter here

OpenBridge runs automated accessibility checks (axe) on every change. Those checks catch many
problems, but they cannot tell whether a screen makes sense when read aloud, or whether a person can
finish a screening with only a keyboard. That takes people. A manual pass with screen readers is a
launch blocker on the [roadmap]({{repo}}/blob/HEAD/ROADMAP.md), and OpenBridge does not claim to meet
WCAG 2.2 AA (the web accessibility standard) until people have tested it.

## Before you start

- Open OpenBridge. You can [[run it on your computer|Run-OpenBridge-on-Your-Computer]] from the
  single-file download.
- Use a made-up household. Never type real people's details.
- Have something to take notes in. Write down the screen, what you did, and what happened.

## Steps

Work through the [manual accessibility checklist]({{repo}}/blob/HEAD/docs/ACCESSIBILITY_CHECKLIST.md).
Do the parts that fit your tools. Each one helps.

1. **Keyboard only (anyone can do this).** Put the mouse away. Use Tab and Shift+Tab to move, and
   Enter or Space to choose. Check that you can reach and use every button and field, that the
   order makes sense, that you can always see where you are, and that the **Skip to content** link
   works. Go from the start of a screening all the way to the results.
2. **Screen reader (VoiceOver on Mac or iPhone, NVDA on Windows).** Check that each field says its
   label and value, that moving to a new step is announced, that the privacy notice ("Your
   information is only on this device") and the warning before your answers are cleared are read
   out, and that results and their reasons are read in a sensible
   order.
3. **Zoom and small screens (anyone).** Zoom the browser to 200%, and try a narrow window or a phone.
   Check that nothing is cut off and nothing needs sideways scrolling to read. Check that text is
   easy to read against its background.
4. **Words and errors (anyone).** Check that the words are plain, that number fields give an example
   and accept `$` and commas, and that an error says exactly what to fix next to the right field.
5. **Motion and timing.** If you leave the app alone, it clears your answers to protect your
   privacy. Check that a warning appears first and gives you enough time to respond. If your device
   is set to reduce motion, check that the app does not animate.

Also try the results page, a program's details page with **Show the math** open, and the
**Language** menu switched to ES.

## How to report what you find

1. On GitHub, open a **Bug report** issue (see [[Ways to help|Contribute-Without-Code]] for how).
2. In "What happened?", say which checklist item failed and what you expected.
3. In "Steps to reproduce", list the screen and the keys or gestures you used.
4. In "Browser and device", name the browser, the device, and the assistive technology and its
   version, for example "NVDA 2024.4 with Firefox on Windows 11".
5. Set Mode and Language if you know them.

One problem per issue is easiest to fix. A report that everything worked is useful too: email it,
with the tools you used, to openbridge@starlingtek.com. You can also email any finding if you prefer
not to use GitHub.

## Related pages

- [[Ways to help|Contribute-Without-Code]]
- [[Using OpenBridge|Using-OpenBridge]]
- [[Translate OpenBridge|Translate-OpenBridge]]
