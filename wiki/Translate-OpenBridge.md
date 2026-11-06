# Translate OpenBridge

OpenBridge is in English and Spanish today. This page explains how translations work, how to review
the Spanish, and how to ask for a new language. It is for translators and community groups. You do
not need to write code.

> The Spanish copy has not yet been reviewed by a qualified translator. That review is on the
> [roadmap]({{repo}}/blob/HEAD/ROADMAP.md), and it is a great place to help.

## How translations work

- Every word you see in the app lives in a few text files, one set per language, in the
  [locales folder]({{repo}}/tree/HEAD/packages/web-app/src/i18n/locales). English is in `en/` and
  Spanish is in `es/`.
- Each language has the same five files: `common.json` (most screens), `reasons.json` (why a result
  came out the way it did), `math.json` (the **Show the math** table), `factors.json` (names
  of the facts a result is based on, such as "Monthly income"), and `steps.json` (next steps and
  documents to bring).
- Each line pairs a fixed label, called a key, with the text, for example
  `"start": "Start"` in English and the Spanish text for the same key in `es/common.json`. You
  only ever change the text on the right. Never change the key.
- **English is the base.** Every key must exist in English. If a Spanish line is missing, the app
  shows the English line instead.
- Parts in double curly braces, such as `{{program}}` or `{{file}}`, are filled in by the app. Keep
  them exactly as they are, but you can move them within the sentence.
- Official application forms stay in English, because agencies require them. People using another
  language get a companion guide that explains the steps.

## Plain language in every language

The people using OpenBridge are often stressed, short on time, and may not read well in any
language. A correct translation is not enough. It must also be easy.

- Aim for about a 6th to 8th grade reading level. Short sentences, common words.
- Say "you". Say what to do, not what went wrong.
- Results must never sound final. Keep the hedges ("may", "might", "likely") in your language.
- Use the words people in the community use, not only official agency terms.
- No em dashes and no emoji.

The full rules are in the [language and accessibility standard]({{repo}}/blob/HEAD/.kiro/steering/ui-i18n-accessibility.md).

## Review the Spanish without code

1. Open OpenBridge and switch the **Language** menu at the top of the page from EN to ES.
2. Screen a made-up household and read every screen, the results, the program details, and
   **Show the math**.
3. You can also read the files side by side on GitHub: open a file in `en/` in one browser tab and
   the same file in `es/` in another.
4. For each problem, write down the English text, the current Spanish, and your suggested Spanish.
5. Send your list. Open a **Bug report** issue on GitHub (set Language to Spanish), or email
   openbridge@starlingtek.com. One issue with a list is fine.

## Propose a new language

Open a **Feature request** issue, or email openbridge@starlingtek.com. Tell us the language, who in
your community would use it, and whether you or your group can translate and review it. A new
language needs a translator and a second person to review, so say if you can be either one.

## What a developer does to add a language

You do not need to do this part. For reference, a developer:

1. Copies the `en/` folder to a new folder named for the language code (for example `vi/`), for the
   translator to fill in.
2. Registers the language in
   [`i18n/config.ts`]({{repo}}/blob/HEAD/packages/web-app/src/i18n/config.ts) so it shows in the
   **Language** menu.
3. Checks the screens, PDFs, and companion guide in the new language, and runs the checks in
   [[Developer setup|Developer-Setup]].

Some text is not in the language files yet, such as some form error messages and the Terms of Use
page. Moving it is on the roadmap.

## Related pages

- [[Ways to help|Contribute-Without-Code]]
- [[Test accessibility|Test-Accessibility]]
- [[Glossary]]
