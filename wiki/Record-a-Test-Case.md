# Record a test case

This page shows you how to turn a made-up household into a test case, without writing code. It is
for caseworkers, navigators, and policy experts. A test case (also called a "golden fixture") is a
household plus the results you expect for it. OpenBridge checks every test case each time the rules
change, so a wrong change gets caught before it reaches a family.

## Before you start

- Open OpenBridge. You can [[run it on your computer|Run-OpenBridge-on-Your-Computer]] from the
  single-file download.
- Think of a household you see often, or a tricky one: someone right at an income limit, an older
  or disabled member, a pregnant member, or children who qualify when their parents do not.
- **Make it up.** Change names, ages, and amounts so it matches no real person. Use round numbers.

## Steps

1. **Screen the made-up household.** Choose **Start** and answer the questions as you would for a
   client. You will land on the results page.
2. **Open the test-case page.** At the bottom of the results page, choose **For rule reviewers:
   save this as a test case**. This opens the page titled "Save a test case for rule reviewers"
   (the `/review` page).
3. **Read the date note.** The page says: "Test cases are checked as if today were June 1, 2024."
   See [Why the date is fixed](#why-the-date-is-fixed) below.
4. **Confirm it is made up.** Check the box "This family is made up. It has no real person's
   details." You cannot download until you do.
5. **Name it.** In **Test case name (required)**, describe the household in a few words, for
   example "single parent with two kids". The name becomes the file name.
6. **Set the expected results.** Under **What result do you expect?** there is one choice per
   program, and for some programs one per person (for example "Medicaid / CHIP (health coverage)
   for" a child). We fill in what OpenBridge says now. Change any you think are wrong. The choices
   are:
   - You likely qualify
   - You may well qualify
   - You might qualify. It is worth applying.
   - You may not qualify right now
   - Not enough information yet
7. **Download.** Choose **Download test case**. You will see "Saved" and the file name, such as
   `single-parent-with-two-kids.json`.
8. **Send it to us.** Use one of the two ways below.

## How to send it to us

**Option A: an issue (easiest).** On the OpenBridge GitHub page, choose **Issues**, then **New
issue**, then **Eligibility rule correction**. Pick the program and state. In "What OpenBridge says
or uses now", say what the results page showed. In "What it should be", say what you expect and
why. Add an official source that supports your answer. Drag the downloaded file into one of the text
boxes to attach it. See [[Report a rule problem|Report-a-Rule-Problem]] for each field.

**Option B: a pull request.** A pull request asks to add a file to the project. On GitHub, open
`data/states/<code>/fixtures/`, where `<code>` is the state's two letters in lowercase (`oh`, `tx`,
or `wa`). For example, [Ohio's test cases]({{repo}}/tree/HEAD/data/states/oh/fixtures). Choose
**Add file**, then **Upload files**, add your file, and follow the prompts to propose the change.

If you cannot attach the file, or you do not use GitHub, email it to openbridge@starlingtek.com.

## Why the date is fixed

Results can depend on the date. A child's age changes, and so does which year's poverty line
applies. So every test case is checked as if today were June 1, 2024, and the test-case page uses
that same date to fill in its choices. That is why a result on this page may not match your
results page. It is expected. If you change nothing, your test case passes today.

## Tips

- If you changed an expected result, that is the most useful part. Explain why in your issue.
- The file also saves the benefit amount OpenBridge estimated, but only for programs where you kept
  OpenBridge's result.
- Your answers live only in the open browser tab. If you reload or close it, screen again.
- If you open the test-case page before screening, it asks you to screen first and gives you a
  **Start a screening** link.
- One household per test case. Record as many as you like.

## What happens next

A maintainer checks the file and adds it to the state's test cases. If you said OpenBridge is
wrong, your test case shows the problem: it will not pass until the rule is fixed, and a
subject-matter expert reviews the fix. For the technical format, see [[Golden test cases|Golden-Test-Cases]].

## Related pages

- [[Ways to help|Contribute-Without-Code]]
- [[Report a rule problem|Report-a-Rule-Problem]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
- [[Golden test cases|Golden-Test-Cases]]
