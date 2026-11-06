# OpenBridge on one page

This page explains the whole project in about five minutes. It is for anyone deciding whether
OpenBridge matters to them: navigators, partner organizations, funders, experts, and contributors.

> **OpenBridge is a prototype.** The rules are drafts that experts have not checked yet, and legal
> review has not happened. Results are estimates, not decisions. There is no public site yet.

## The problem

Millions of people qualify for food, health, and energy help they never get. The programs exist.
The path in is the problem.

- Each program has its own website, its own rules, and its own forms.
- The same income questions get asked again and again, in slightly different ways.
- Nothing tells a family that qualifying for one program often means qualifying for others.
- Many people apply from a library computer or an older phone, read below a high school level, or
  are more comfortable in a language other than English.
- Some families, especially mixed-status families, are afraid to type their details into a website.
- One wrong "you do not qualify" can end the search for good.

## What OpenBridge does

You answer one short set of plain-language questions about your household and income. OpenBridge
checks those answers against several programs at the same time and explains each result.

- **Programs:** SNAP, Medicaid and CHIP (income-based pathways only), and WIC, with LIHEAP and TANF
  at an early stage.
- **States:** Ohio, Texas, and Washington. **Languages:** English and Spanish.
- **Every result is explained** in plain words, and "Show the math" opens the exact steps with a
  link to the source of each rule value.
- **It is careful.** It will not say "no" when you are close to a limit, when an answer is missing,
  or because of immigration status alone.
- **It helps with paperwork:** a printable summary, an Ohio SNAP and Medicaid field list, and a
  Spanish guide for English-only forms.
- **It is private by design.** Everything runs in your browser. No account, no tracking, and
  nothing you type is sent to a server.
- **It works offline** after the first visit, or from a single file you download.
- **It helps helpers:** navigator mode lets a caseworker screen several clients in a row.

New words? See the [[Glossary]]. For how it compares to a chatbot, see
[[Why OpenBridge|Why-OpenBridge]].

## Who it is for

| Who                     | What they get                                                        |
| ----------------------- | -------------------------------------------------------------------- |
| Benefit seekers         | One private session that ends with a clear next step                 |
| Navigators              | Faster screening across programs, with no new accounts to manage     |
| Community organizations | A free app they can host on their own site                           |
| Contributors            | A setup where adding a state is mostly data and test cases, not code |

## What it is not

OpenBridge does not submit applications, connect to government systems, decide eligibility, give
legal advice, or keep anyone's records. Only the agency that runs a program can decide who
qualifies.

## Where things stand

The Phase 1 prototype is built and its automated checks pass. What is missing is the human work
that makes results trustworthy:

- Expert review of the rules in all three states (not started; Ohio reviewers identified).
- Updating reference figures, which are from 2024.
- Legal review of the Terms of Use, disclaimers, and referral policy.
- Testing with real benefit seekers and navigators, and with screen readers.

See [[Roadmap and status|Roadmap-and-Status]] for the full list.

## How you can help

The most valuable help right now is not code.

- **Know how benefits work?** [[Review rules as an expert|Review-Rules-as-an-Expert]] or
  [[record a test case|Record-a-Test-Case]].
- **Spot a wrong rule?** [[Report a rule problem|Report-a-Rule-Problem]].
- **Speak Spanish or another language?** [[Translate OpenBridge|Translate-OpenBridge]].
- **Run an organization?** Pilot it with your navigators and tell us what works.
- **Write code?** Start with [[Developer setup|Developer-Setup]].

Contact: openbridge@starlingtek.com. OpenBridge is stewarded by StarlingTek, LLC and licensed under
[AGPL-3.0-only]({{repo}}/blob/HEAD/LICENSE).

## Related pages

- [[Why OpenBridge|Why-OpenBridge]]
- [[White paper|White-Paper]]
- [[Roadmap and status|Roadmap-and-Status]]
- [[Ways to help|Contribute-Without-Code]]
