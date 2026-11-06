# Glossary

Plain definitions of words used across this wiki and in OpenBridge. Terms are in alphabetical
order. If a word you need is missing, email openbridge@starlingtek.com or open an issue.

## A to C

**211.** A free phone line and website ([211.org](https://www.211.org/)) that connects people to
local help, such as food, housing, and utility aid. OpenBridge points to it when you need more help.

**Adjunctive eligibility.** A shortcut for WIC. If you already get certain benefits (in OpenBridge,
SNAP, Medicaid, or TANF), you can meet WIC's income rule without checking your income again.

**AGPL.** The GNU Affero General Public License, the open-source license OpenBridge uses
(AGPL-3.0-only). Anyone who runs a changed version as a service must share their changes.

**BBCE (broad-based categorical eligibility).** A SNAP option some states use. It can raise the
gross income limit and remove the asset and net income tests for most households.

**Benefit cliff.** A point where earning a little more causes a benefit to drop sharply or stop, so
the household can end up worse off. "What if my income changes?" shows where cliffs may be.

**Calculation step.** One line of the math behind a result, such as "monthly income" or "limit for
a household of 3". "Show the math" lists these steps, each linked to its source when one is listed.

**Categorical eligibility.** A rule that says if you already get one benefit, you meet the income
rules for another. For example, a household that receives TANF cash help is treated as meeting
SNAP's income rules.

**CHIP (Children's Health Insurance Program).** Health coverage for children in families that earn
too much for Medicaid but not enough for private insurance. OpenBridge estimates it through
Medicaid's child income limits.

## D to L

**Draft and verified.** The status of a state's rules. `draft` means the values have not been
checked by an expert. Only a human expert can mark a state `verified`. All three states are
`draft` today.

**Eligible, likely eligible, possibly eligible, ineligible, unknown.** The five outcomes
OpenBridge can give. "Likely eligible" means you pass the tests, but the result relies on answers
nobody can check yet. "Possibly eligible" means you are close to a limit, an answer is missing, or
a rule cannot be checked. See [[Understanding your results|Understanding-Your-Results]].

**FPL (federal poverty level).** Yearly income amounts set by the federal government, by household
size. Many programs set their limits as a percentage of the FPL, such as 130%. Alaska and Hawaii
have their own tables. The amounts change every January.

**Golden test case (fixture).** A made-up household with the results an expert expects, worked out
by hand. OpenBridge checks its answers against these on every change. See
[[Golden test cases|Golden-Test-Cases]].

**LIHEAP (Low Income Home Energy Assistance Program).** Help paying heating and cooling bills.
OpenBridge's support for LIHEAP is early.

## M to P

**MAGI (modified adjusted gross income).** The income rule most Medicaid and CHIP pathways use,
based on tax rules. OpenBridge only checks MAGI pathways, not Medicaid based on age, disability, or
high medical bills.

**MCP (Model Context Protocol).** A standard way for AI assistants to use outside tools. OpenBridge's
MCP server lets an assistant use its rules engine. See
[[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]].

**Medicaid.** Free or low-cost health coverage run by each state. Some states expanded it to cover
more adults with low incomes.

**Navigator.** A caseworker or volunteer who helps people apply for benefits, for example at a food
bank, library, or clinic. Navigator mode lets them screen several clients in a row. See
[[Guide for navigators|Navigator-Guide]].

**Provenance (source).** Where a rule value came from: the official document, its link, and the date
it was published. Every rule value in OpenBridge must cite one.

**PWA (Progressive Web App).** A website that can be installed like an app and keeps working
offline after your first visit. OpenBridge is a PWA.

## R to Z

**Reason code.** A short label the engine gives for each part of a result, such as "income is
under the limit". The app turns each code into plain words in your language.

**SME (subject-matter expert).** A person who knows a program's rules well, such as a caseworker,
agency staff member, or policy researcher. SMEs review and sign off on state rules. See
[[Review rules as an expert|Review-Rules-as-an-Expert]].

**SNAP (Supplemental Nutrition Assistance Program).** Monthly help buying food, once called food
stamps. SNAP figures change every October.

**State adapter.** The data file that holds one state's rules: income limits, program options, and
application links, each with a cited source. Adding a state means writing an adapter and test
cases, not changing the engine. See [[State adapters|State-Adapters]].

**TANF (Temporary Assistance for Needy Families).** Cash help for families with children. Rules
vary a lot by state. OpenBridge's support for TANF is early.

**WIC (Special Supplemental Nutrition Program for Women, Infants, and Children).** Food help and
nutrition support for pregnant and postpartum people, infants, and children under 5. Part of
qualifying is a nutrition check at a WIC clinic, so OpenBridge results stop at "possibly
eligible".

## Related pages

- [[FAQ]]
- [[Understanding your results|Understanding-Your-Results]]
- [[How the rules engine works|How-the-Rules-Engine-Works]]
