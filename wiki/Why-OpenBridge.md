# Why OpenBridge

This page explains when OpenBridge is a better choice than asking an AI chatbot or using a screener
for one program, and when it is not. It also explains how AI assistants and OpenBridge can work
together.

> **OpenBridge is a prototype.** Its rules are drafts that experts have not checked yet. The
> strengths below are about how it is built. They do not mean its answers are verified.

## Compared with asking an AI chatbot

A chatbot is good at conversation. It can explain a program, help you find words, and answer
follow-up questions. But it is not built to do eligibility math the same way every time.

| What matters                 | General AI chatbot                                 | OpenBridge                                                        |
| ---------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Same answer every time       | Answers can change from one try to the next        | Same answers in, same result out, every time                      |
| Where the numbers come from  | Often from memory, which may be old or made up     | From a versioned rule file, with a cited source for each value    |
| Showing the work             | Explains in words, but the steps are hard to check | "Show the math" lists each step and links each rule to its source |
| When something is uncertain  | May sound confident either way                     | Leans to "possibly eligible" and says why                         |
| Your information             | Sent to the AI company and its model               | Stays in your browser; nothing is sent                            |
| Without internet             | Does not work                                      | Works offline after the first visit, or from a downloaded file    |
| Paperwork                    | Can describe forms                                 | Makes a printable summary and form help                           |
| Tested against known answers | No public test set                                 | Checked against hand-worked sample households on every change     |

None of this means a chatbot is useless. It means the math and the rule values should come from
something that can be checked.

## Compared with a screener for one program

Many good screeners exist. Some cover only one program or one state, need an account, keep your
data on a server, or give an answer without showing how.

- **One questionnaire, many programs.** You enter your household and income once. OpenBridge
  checks SNAP, Medicaid and CHIP, and WIC together, with LIHEAP and TANF at an early stage.
- **Per-person results.** For Medicaid and WIC, children who qualify are not hidden behind a
  household "no".
- **Cautious outcomes.** It will not say "no" near a limit, on a missing answer, on a rule it
  cannot check, or on immigration status alone. See [[Understanding your results|Understanding-Your-Results]].
- **Benefit cliffs.** "What if my income changes?" shows where a result may change or stop if you
  earn more.
- **Open and portable.** The code is open source, and any organization can host it or run it from
  one file.

Where a single-program tool may do better today: it may cover more states, use current figures,
or be run by the agency itself. OpenBridge covers three states with draft 2024 figures. If an
official agency screener exists for your state, it is worth using too.

## Privacy, in plain words

In the web app, all the math happens on your device. Your answers live only in the app's
short-term memory. They are not saved in the browser, and there are no cookies, analytics, or
error reports. If you want to come back later, you can download a save file locked with a
passphrase. See [[Privacy and your data|Privacy-and-Your-Data]].

## How AI and OpenBridge work together

You do not have to choose. OpenBridge includes an
[MCP server]({{repo}}/blob/HEAD/packages/mcp-server/README.md). MCP is a standard way for AI
assistants to use outside tools. With it:

1. The AI assistant has the conversation and asks the questions in plain words.
2. It sends the answers to OpenBridge's tools, such as `screen_household` and
   `explore_income_change`.
3. OpenBridge does the math with the same engine and rule files as the web app, and returns the
   reasons, the steps, and the sources.
4. The assistant explains the result, without guessing at income limits.

There is a tradeoff. OpenBridge's server stores and logs nothing, but your answers pass through
the AI service you use, under that service's privacy terms. Names, Social Security numbers, and
addresses are never needed. If privacy matters most, use the web app instead. See
[[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]].

## Honest limits

- Rules in all three states are drafts, and figures are from 2024.
- Medicaid covers income-based pathways only. CHIP is approximated through Medicaid child limits.
- WIC results stop at "possibly eligible" because a nutrition check happens in person.
- Only the agency can decide. OpenBridge does not submit anything.

## Related pages

- [[One-Pager]]
- [[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]]
- [[Privacy and your data|Privacy-and-Your-Data]]
- [[How the rules engine works|How-the-Rules-Engine-Works]]
