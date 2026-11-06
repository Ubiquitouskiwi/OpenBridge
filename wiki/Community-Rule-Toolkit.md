# Community rule toolkit

The OpenBridge Rule Toolkit lets people who know benefits policy or law check and improve
OpenBridge's rules without writing code. It is one file you download and open in your web browser.
Nothing you type is sent anywhere.

> The rules in OpenBridge are drafts that experts are still checking. Your review is part of that
> checking. Only a subject-matter expert sign-off can mark a state's rules as verified.

## Before you start

1. Go to the OpenBridge repository's **Releases** page and download
   `openbridge-rule-toolkit-v<version>.zip` from the newest release. If there is no release yet, a
   developer can build it with `npm run build` and find it at
   [`packages/rule-toolkit/dist/`]({{repo}}/tree/HEAD/packages/rule-toolkit).
2. Unzip the folder and double-click **OpenBridge-Rule-Toolkit.html**. It opens in your browser and
   works without the internet. If it opens in the wrong program, right-click it, choose
   **Open with**, and pick Chrome, Edge, Firefox, or Safari.
3. The home page lists three tools. Choose **Open** next to the one you need.

   ![The toolkit home page with its three tools]({{repo}}/raw/HEAD/docs/screenshots/toolkit-home.png)

## Review a state's rules

Use this to check a whole state against its official sources in one sitting.

1. Choose **Review a state's rules**, then pick a state.
2. Each rule value is shown in plain words, under **What the rules say**, for example "130% of the
   poverty line" or "$2,750.00". Under **Source** you see the official source and the date it was
   published, or **No source listed yet**.
3. For each value, answer **Does it match the source?** with **Matches the source**,
   **Does not match**, or **Not sure**. Add a note if it helps, for example the page number.
4. Watch the count at the top (for example "7 of 15 checked").
5. Under **About you (optional)** you can add your name and role. These go only into the report you
   download.
6. Choose **Download report** to save a report file, or **Copy report text** to paste it somewhere.

   ![Review a state's rules for Ohio, with one value marked Matches the source]({{repo}}/raw/HEAD/docs/screenshots/toolkit-review.png)

"No source listed yet" is not an error in your review. It tells us which values still need a
citation, and finding one is a great contribution.

## Propose a rule change

Use this when a value is wrong or out of date and you have the official source that shows the right
one.

1. Choose **Propose a rule change**, then pick a state, a **Program**, and a **Rule value**. You see
   **What the rules say now** and the **Source now**.
2. Enter the **New value**: a percent of the poverty line, a dollar amount, or yes or no. Some
   values can be **Not used** when that test does not apply in the state.
3. If the same source shows more than one change, choose **Add another change from the same
   source**. For a different source, make a second proposal.
4. Under **Official source**, enter its name, its web address (starting with `https://`), and the
   date printed on it.
5. Under **Why should this change?**, say in your own words where the number is in the source.
6. Choose **Check my proposal**. Fix anything marked in red. When it says
   **Your proposal is ready**, choose **Download proposal file** and **Copy issue text**.

   ![A finished rule change proposal with a made-up source, ready to download]({{repo}}/raw/HEAD/docs/screenshots/toolkit-propose.png)

## Check a test case

Use this to see whether the current rules give the results a test case expects, for example one
someone made with [Record a test case](Record-a-Test-Case) or one already in the project.

1. Choose **Check a test case**, then choose the test case file (it ends in `.json`).
2. You see each program, and each person where it applies, with what the test case expects, what the
   rules give, and **Pass** or **Mismatch**.
3. Open **Why** and the math to see the reasons and the numbers behind each result.

   ![Check a test case, with every program marked Pass]({{repo}}/raw/HEAD/docs/screenshots/toolkit-check.png)

Test cases are checked as if today were June 1, 2024, the same date the project's own checks use, so
results match what reviewers see in the repository.

## Send us your work

Attach the file you downloaded to a new issue using the **Eligibility rule correction** form (see
[[Report a rule problem|Report-a-Rule-Problem]]), or email it to openbridge@starlingtek.com. For a
proposal, paste the copied issue text into the issue too.

What happens next: a maintainer applies your proposal with one command
(`npm run rules:apply -- proposal.json`), which records your source as the citation and keeps the
state marked draft. The change then goes through review like any other, and an expert checks it
before a state can be marked verified.

## Privacy and limits

- The toolkit makes no network connections and saves nothing in the browser. Your work leaves your
  computer only as a file you choose to download.
- Use made-up households for test cases, never a real person's details.
- The toolkit carries the rules from the release you downloaded. Download a newer release to review
  newer rules.
- It covers state rule values today. Federal figures (the poverty line and SNAP amounts) are updated
  by maintainers; see [[Yearly data updates|Yearly-Data-Updates]].
- The toolkit is in English for now.

## Related pages

- [[Review rules as an expert|Review-Rules-as-an-Expert]]
- [[Record a test case|Record-a-Test-Case]]
- [[Add or change a rule|Add-or-Change-a-Rule]]
- [[Ways to help|Contribute-Without-Code]]
