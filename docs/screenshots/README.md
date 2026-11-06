# Screenshots

Pictures of OpenBridge and the community rule toolkit, used by the [README](../../README.md), these
docs, and the [wiki](../../wiki/). Every household, name, and source in them is made up.

> These show a prototype. The rules are drafts that experts have not checked yet, so the results
> in the pictures are examples of how the app looks, not real answers for any family.

## How they are made

A script drives the real app with Playwright and saves each picture here. Nothing is edited by
hand, so anyone can make the same pictures again.

```bash
npx playwright install chromium   # once
npm run screenshots
```

The script lives in [`scripts/screenshots/`](../../scripts/screenshots/). It builds the app and
the toolkit, serves the app on `127.0.0.1` only, and uses a fixed date (March 2, 2026) so the
pictures do not change from run to run unless the app does.

The made-up household is one adult, age 30, and a 3-year-old child in Ohio, earning $1,800 a
month. The navigator dashboard adds a second made-up client, age 67, earning $1,400 a month.

**When to run it:** after any change that changes how a screen looks. Commit the new pictures in
the same pull request, and look at each changed picture before you commit it.

## Adding a picture

1. Add a step to `scripts/screenshots/web-app.capture.ts` (or `rule-toolkit.capture.ts`) that
   calls `shoot(page, '<name>')` for the whole page or `shootPart(locator, '<name>')` for one
   part. Use a short kebab-case name.
2. Run `npm run screenshots`.
3. Use it. In the README and docs, link it with a relative path. In the wiki, use
   `![What it shows]({{repo}}/raw/HEAD/docs/screenshots/<name>.png)`. `npm run check:wiki` fails
   if a wiki picture does not exist.
4. Add it to the list below.

## The pictures

### Screening app

| File                                                                 | Shows                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------- |
| [welcome.png](./welcome.png)                                         | Start page: who it is for, Start, I have a saved file |
| [welcome-spanish.png](./welcome-spanish.png)                         | Start page in Spanish                                 |
| [screen-1-location.png](./screen-1-location.png)                     | Step 1, where you live, with the privacy banner       |
| [screen-2-household.png](./screen-2-household.png)                   | Step 2, the people in the household                   |
| [screen-3-income.png](./screen-3-income.png)                         | Step 3, income                                        |
| [screen-4-expenses.png](./screen-4-expenses.png)                     | Step 4, optional details                              |
| [screen-5-review.png](./screen-5-review.png)                         | Step 5, review before results                         |
| [results.png](./results.png)                                         | The whole results page                                |
| [results-top.png](./results-top.png)                                 | The top of the results page                           |
| [results-documents.png](./results-documents.png)                     | Your documents and Share for review                   |
| [results-save-progress.png](./results-save-progress.png)             | Save my progress to a file, opened                    |
| [program-snap-show-the-math.png](./program-snap-show-the-math.png)   | SNAP details with Show the math opened                |
| [program-snap-top.png](./program-snap-top.png)                       | The top of the SNAP details, one screen tall          |
| [program-medicaid-per-person.png](./program-medicaid-per-person.png) | Medicaid details with a result for each person        |
| [what-if.png](./what-if.png)                                         | What if my income changes, with $250 more a month     |
| [what-if-changes.png](./what-if-changes.png)                         | The what-if comparison table, one screen tall         |
| [get-help.png](./get-help.png)                                       | Get help: referral organizations                      |
| [resume.png](./resume.png)                                           | Resume from a saved file                              |
| [review-test-case.png](./review-test-case.png)                       | Saving a screening as a test case for rule reviewers  |
| [navigator-dashboard.png](./navigator-dashboard.png)                 | Navigator dashboard with two made-up clients          |
| [phone-results.png](./phone-results.png)                             | Results on a phone-sized screen (390 pixels wide)     |

### Community rule toolkit

| File                                         | Shows                                     |
| -------------------------------------------- | ----------------------------------------- |
| [toolkit-home.png](./toolkit-home.png)       | Toolkit home with its three tools         |
| [toolkit-review.png](./toolkit-review.png)   | Review a state's rules, one value checked |
| [toolkit-propose.png](./toolkit-propose.png) | Propose a rule change, ready to download  |
| [toolkit-check.png](./toolkit-check.png)     | Check a test case, every row passing      |
