# Frequently asked questions

Short answers to common questions from people looking for help, navigators, organizations that
want to host OpenBridge, and contributors. New words are explained in the [[Glossary]].

## For people looking for help

### Will OpenBridge tell me if I qualify?

It gives an estimate, not a decision. Only the agency that runs a program can decide who
qualifies. OpenBridge is also a prototype, and its rules have not been checked by experts yet. If a
result says you might qualify, it is worth applying.

### Which programs and states does it cover?

SNAP, Medicaid and CHIP, and WIC, with LIHEAP and TANF at an early stage. It covers Ohio, Texas, and
Washington. Only those three states can be chosen today. If you live somewhere else, call 211 or
visit [211.org](https://www.211.org/) to find help near you.

### Is my information sent anywhere?

No. In the web app, everything runs in your browser. There is no account, no tracking, and nothing
is sent to a server. See [[Privacy and your data|Privacy-and-Your-Data]].

### I am using a library computer. Is that safe?

The app keeps your answers only in short-term memory, not in the browser's storage. Use the "Clear
my data / Start over" button when you finish. The app also clears itself after a period of no
activity, and warns you first.

### Will my immigration status be shared, or count against me?

Your answers stay on your device. The status question is optional, and you can choose "prefer not
to say". OpenBridge never gives a "no" based on immigration status alone.

### Do I need my Social Security number or name?

No. OpenBridge does not ask for names, Social Security numbers, dates of birth, or contact details.
The official application may ask for them later, on the agency's own site.

### Why did it say "You might qualify" instead of yes or no?

OpenBridge is careful on purpose. If you are close to a limit, if an answer is missing, or if a rule
is something it cannot check (like the WIC nutrition check), it says "might". See
[[Understanding your results|Understanding-Your-Results]].

### Can I stop and finish later?

Yes. You can download a save file locked with a passphrase you choose, then open it later from the
Resume page. Keep the passphrase safe. If you forget it, nobody can open the file, and you will need
to start over.

### Does it work in Spanish?

Yes, the app works in English and Spanish. Most official forms are English only, so Spanish
speakers also get a guide that explains how to fill in the English form.

### Does OpenBridge apply for me?

No. It helps you get ready, with a printable summary and form help, and links to the official
application. You review and submit the application yourself.

### What if I might lose benefits if I earn more?

Open "What if my income changes?" from your results. It shows where a result may change or stop.
Talk with a navigator or the agency before you change your hours or take a new job.

## For navigators

### Can I screen several clients in a row?

Yes. Choose navigator mode at the start. It turns off the automatic clearing so you control when to
move to the next client. See [[Guide for navigators|Navigator-Guide]].

### Can I check how a result was worked out?

Yes. Open "Show the math" on any result. It lists each step and links each rule value to its
official source, or says "Source not listed yet" when one is missing.

### Does it cost anything or need an account?

No. It is free, open source, and needs no account.

## For organizations and hosts

### Can we put OpenBridge on our own website?

Yes, once you are ready to run a prototype. Each release has a hosted download with Docker,
Compose, nginx, and Caddy options. See [[Host it for others|Host-OpenBridge]]. There is no official
public site yet.

### Can we use it without internet?

Yes. Download the local version, unzip it, and open `OpenBridge.html`. See
[[Run it on your computer|Run-OpenBridge-on-Your-Computer]].

### Can we use it with an AI assistant?

Yes, through the MCP server. Your answers then pass through the AI service you use. See
[[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]].

## For contributors

### I know benefits but not code. How can I help?

That is the most needed help right now. You can [[review rules as an expert|Review-Rules-as-an-Expert]],
[[record a test case|Record-a-Test-Case]], or [[report a rule problem|Report-a-Rule-Problem]].
More ideas are on [[Ways to help|Contribute-Without-Code]].

### How do I add a new state?

Each state is a data file with cited sources, plus test cases. You can offer to help with the "New
state request or offer" issue template. See [[Add a new state|Add-a-New-State]].

### Was OpenBridge written by AI?

Mostly, yes, working from a reviewed specification. AI-written changes follow the same rules and
checks as human ones, and a human maintainer reviews every pull request. See
[[Building with AI agents|Building-with-AI-Agents]].

### How do I report a security problem?

Do not open a public issue. Follow [SECURITY.md]({{repo}}/blob/HEAD/SECURITY.md) to report it
privately.

### Who runs the project?

StarlingTek, LLC stewards it as open community infrastructure under the AGPL-3.0 license. Email
openbridge@starlingtek.com with general questions.

## Related pages

- [[Glossary]]
- [[Using OpenBridge|Using-OpenBridge]]
- [[Ways to help|Contribute-Without-Code]]
- [[Roadmap and status|Roadmap-and-Status]]
