# Report a rule problem

Use this page when a rule value, an income limit, or a result in OpenBridge looks wrong. It walks
you through the "Eligibility rule correction" form on GitHub, field by field. You do not need to
write code. Reports like this are among the most valuable help the project gets.

> Use a made-up household in your report, never a real one. Do not include real names, incomes, or
> immigration status.

## Before you start

- A free GitHub account (see [[Ways to help|Contribute-Without-Code]]), or use email instead.
- Where you saw the problem: a result card, the **Show the math** table on a program's details
  page, or a file such as `data/states/oh/adapter.json`.
- An official source that shows the correct value.

## Steps

1. On the OpenBridge GitHub page, choose **Issues**, then **New issue**.
2. Choose **Eligibility rule correction**.
3. Fill in the fields below, then submit the issue.

| Field                                       | What to write                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Program (required)                          | Pick one: SNAP, Medicaid, CHIP, WIC, LIHEAP, TANF, Federal poverty guidelines, or Other.                                |
| State (required)                            | The two-letter code, for example OH.                                                                                    |
| What OpenBridge says or uses now (required) | The value or result, and where you saw it, for example "SNAP gross income limit shows 130% on the Show the math table". |
| What it should be (required)                | The correct value or result, and a sentence on why.                                                                     |
| Official source (URL) (required)            | A link to an agency page, policy manual, or published table.                                                            |
| Source publication or effective date        | When the source was published or when the value took effect.                                                            |
| Your background (optional)                  | For example navigator or caseworker, agency staff, legal aid, or policy researcher.                                     |

One problem per report makes each one easier to check and fix.

## What makes a good source

- **Official.** It comes from the agency that sets the rule: HHS for poverty guidelines, USDA FNS
  for SNAP and WIC, Medicaid.gov or the state Medicaid agency, or the state agency that runs the
  program.
- **Specific.** It links to the page, manual section, or table with the number, not just the
  agency's home page. Add a page or section number if the document is long.
- **Current and dated.** It shows when it was published or when it takes effect.
- **Public.** Anyone can open it without a login.

News stories, blog posts, and AI chatbot answers are not official sources. They can help you find
one, though.

## What happens after you report

1. A maintainer reads your report and checks the source.
2. If the value needs to change, a contributor updates the state's rule file, cites your source,
   and adds or updates a test case that shows the right result.
3. A subject-matter expert reviews the change. The state stays `draft` until an expert signs off
   on the whole state (see [[Review rules as an expert|Review-Rules-as-an-Expert]]).
4. You can follow each step on your issue.

OpenBridge never guesses rule numbers. If no source can be found, the value is left as it is and
the gap is noted.

## No GitHub account?

Email openbridge@starlingtek.com with the same details: program, state, what OpenBridge shows,
what it should be, and your source. We will open the issue for you.

## Related pages

- [[Record a test case|Record-a-Test-Case]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
- [[Understanding your results|Understanding-Your-Results]]
- [[Add or change a rule|Add-or-Change-a-Rule]]
