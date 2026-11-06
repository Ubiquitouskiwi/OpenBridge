# Community rule toolkit (planned)

> **This toolkit is planned. Most of it does not exist yet.** It is listed under "Community tools
> and documentation (next)" on the [roadmap]({{repo}}/blob/HEAD/ROADMAP.md). This page describes
> the idea, what you can use today, and how to tell us what you need.

The toolkit is for policy experts, legal aid staff, and caseworkers who know the rules but do not
write code. The goal is simple: you should be able to keep OpenBridge's rules right without ever
opening a code editor.

## The idea

The roadmap names three guided tools:

1. **Propose a rule value with a citation.** A form where you pick a state, a program, and a rule,
   enter the correct value, and attach the official source and its date.
2. **Review a state side by side with its sources.** One screen that shows each rule value next to
   the source it came from, so you can check a whole state in one sitting.
3. **Turn screenings into test cases.** Screen a made-up household and save the results you expect,
   so the rules are checked against your expertise every time they change.

The roadmap also plans to offer the toolkit as a release download once it exists. Like the rest of
OpenBridge, it would follow the same rules: nothing you type is sent anywhere, every value needs a
cited source, and only a subject-matter expert can mark a state verified.

## What you can use today

| Need                              | Use this today                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Turn a screening into a test case | The test-case page at `/review`. See [Record a test case](Record-a-Test-Case).                            |
| See where a result came from      | **Show the math** on a program's details page, with each rule value's source, or "Source not listed yet". |
| Propose a corrected value         | The "Eligibility rule correction" issue form. See [Report a rule problem](Report-a-Rule-Problem).         |
| Review a whole state              | The steps in [Review rules as an expert](Review-Rules-as-an-Expert).                                      |
| Offer to help with a state        | The "New state request or offer" issue form.                                                              |

The test-case page is the first piece of the toolkit, and it ships today. The other two tools are
not built yet.

## Tell us what you need

We would rather build the right tool than a fast one. If you review benefit rules for a living, your
answers shape what gets built. Tell us:

- How you check a rule today, and what sources you trust most.
- What slows you down when you compare a value with its source.
- What a review screen would need to show for you to sign off with confidence.
- Which households you would most want to save as test cases.
- Anything you worry about, such as accuracy, liability, or how your name would be recorded.

Open a **Feature request** issue on GitHub and say it is about the community rule toolkit, or email
openbridge@starlingtek.com. See [[Ways to help|Contribute-Without-Code]] if you are new to GitHub.

## Related pages

- [[Record a test case|Record-a-Test-Case]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
- [[Roadmap and status|Roadmap-and-Status]]
