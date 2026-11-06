# Understanding your results

This page explains what OpenBridge tells you after you answer the questions, and what to do next.
It is for benefit seekers and the people who help them.

> **Results are estimates, not decisions.** The rules in OpenBridge are drafts that experts are
> still checking. Only the agency that runs a program can decide if you qualify. You can always
> apply, whatever OpenBridge says.

## The five answers

Each program gets one of five answers. OpenBridge is built to be careful: when it is unsure, it
picks the more hopeful answer and tells you why.

| Answer you see                           | What it means in plain words                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| You likely qualify                       | Your answers pass every check OpenBridge can do.                                            |
| You may well qualify                     | Your answers pass, but some of them (like income) are things the agency will check.         |
| You might qualify. It is worth applying. | You are close to a limit, an answer is missing, or something can only be checked in person. |
| You may not qualify right now            | Your answers are clearly over a limit, and OpenBridge found no other way in.                |
| Not enough information yet               | OpenBridge could not decide, or it does not have the rules for this program yet.            |

OpenBridge never says "You may not qualify right now" because of immigration status alone, when
you are close to a limit, or because of something it cannot work out. WIC is never higher than "You
might qualify", because a WIC clinic checks nutrition needs in person.

## Reasons

Under each answer is a short list of reasons, such as "Your income is close to the limit, so it's
worth applying to be sure." Reasons tell you what drove the answer. They are the best place to start
if a result surprises you.

![A results page with an answer and reasons for SNAP, Medicaid, WIC, LIHEAP, and TANF]({{repo}}/raw/HEAD/docs/screenshots/results.png)

## The details page

Press a program's name to open its details page. There you will find:

- **Estimated monthly benefit**, for programs where OpenBridge can estimate an amount (like SNAP).
- A **factors** table with three columns: **Factor**, **Your value**, and **Limit**. For example,
  "Monthly income" next to the program's monthly income limit.
- **Why**: the full list of reasons.
- **Next steps** and **Documents you'll likely need**.
- **Apply on the official site**, when OpenBridge has the agency's link.

![The SNAP details page with the estimated benefit and the factors table]({{repo}}/raw/HEAD/docs/screenshots/program-snap-top.png)

### Results for each person

Medicaid and CHIP, and WIC, look at each person on their own. For these programs the details page
has an **Each person** section, like "Person 2 (child, age 4)", with that person's own answer and
reasons. It is common for a child to qualify when a parent does not.

![The Medicaid details page with a separate answer for each person]({{repo}}/raw/HEAD/docs/screenshots/program-medicaid-per-person.png)

### Show the math

Press **Show the math** to see exactly how OpenBridge got its answer. A table lists each **Step**,
the **Amount**, and **Where it comes from**:

- **From your answers** means the number came from what you typed.
- A link with a name and date means the number came from that official source.
- **Source not listed yet** means the rule value does not have a source attached yet. Treat it with
  extra care.
- **Worked out from the lines above** means OpenBridge did the arithmetic.

![Show the math opened on the SNAP details page, with a source link for each rule value]({{repo}}/raw/HEAD/docs/screenshots/program-snap-show-the-math.png)

You will also see the note "These rules are drafts. Experts are still checking them." That note is
there because no state's rules have been checked by experts yet. See
[[Roadmap and status|Roadmap-and-Status]].

## What if my income changes?

On the results page, press **What if my income changes?** Choose **Up (more money)** or **Down (less
money)** and type an amount, or press a quick button like "$100 more". A table shows your results
**Now** and **With the change**.

The section **Where things may change** looks for benefit cliffs. A benefit cliff is when earning a
little more makes a benefit shrink or stop, so you can end up with less money overall. OpenBridge
tries raises of up to $3,000 more each month and tells you where each program may change or stop.
Before you change your hours or take a new job, talk with a navigator or the agency.

![The what-if page showing results now and with 250 dollars more each month, and where things may change]({{repo}}/raw/HEAD/docs/screenshots/what-if.png)

## What to do next

| If you see                               | Do this                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| You likely qualify                       | Apply. Use **Next steps** and gather the documents listed.                                     |
| You may well qualify                     | Apply. Have proof of income ready, since the agency will check it.                             |
| You might qualify. It is worth applying. | Apply anyway. Read the reasons to see what the agency will look at.                            |
| You may not qualify right now            | You can still apply. Rules change and OpenBridge can be wrong. Press **Get help** or call 211. |
| Not enough information yet               | Add any missing answers and check again, or ask the agency or a navigator.                     |

If no program looks like a match, OpenBridge says so and points you to **Get help**, where you will
find 211 and legal aid groups for your state. You can also download a **summary sheet (PDF)** to take
with you.

![The Get help page listing 211 and legal aid organizations]({{repo}}/raw/HEAD/docs/screenshots/get-help.png)

## Think a result is wrong?

If you know the rules and think OpenBridge got something wrong, please tell us. See
[[Report a rule problem|Report-a-Rule-Problem]].

## Related pages

- [[Using OpenBridge|Using-OpenBridge]]
- [[How the rules engine works|How-the-Rules-Engine-Works]]
- [[Report a rule problem|Report-a-Rule-Problem]]
- [[Glossary]]
