# Privacy and your data

This page explains, in plain words, what OpenBridge knows about you, where that information lives,
and how to erase it. It is for anyone using OpenBridge and anyone deciding whether to trust it. The
full technical version is the [privacy model]({{repo}}/blob/HEAD/docs/PRIVACY_MODEL.md).

## The short version

- Everything you type stays on your own device, in the browser's memory.
- Nothing is sent to OpenBridge or anyone else. There is no account and no tracking.
- When you close the page or press **Clear my data / Start over**, it is gone.
- The only way to keep your answers is a locked file that you choose to save.

## What OpenBridge asks about

OpenBridge only asks what it needs to check the rules:

- The people in your household, how they are related, and each person's age or date of birth.
- Things like pregnancy, a recent birth, breastfeeding, or a disability.
- Immigration status, which is **optional**. Leaving it blank is always fine, and status alone
  never makes OpenBridge say "no".
- Income: what kind, how much, and how often.
- Optional costs and savings, like rent and utilities.
- Your state and, if you like, your county.

OpenBridge never asks for your name, Social Security number, address, phone number, or email.

## Where it lives

Your answers live only in the memory of the browser tab you are using. OpenBridge does not write
them to the computer's storage, to cookies, or to the browser's autofill. The rule calculations run
on your device too, so your answers never need to travel anywhere.

## How to erase it

- Press **Clear my data / Start over** at the top of any page. This erases your answers, your
  results, and (for navigators) every client on the Dashboard.
- Close the browser tab.
- In the normal mode, OpenBridge clears itself after a few minutes with no activity. It warns you
  first with "Are you still there?" Navigator mode turns this off, because staff clear by hand.

## Saving with a passphrase

If you want to come back later, you can press **Save my progress to a file** on the results page.

- You choose a passphrase of at least 6 characters.
- The file is locked (encrypted) with that passphrase on your device before it is saved.
- **There is no way to recover a forgotten passphrase.** OpenBridge never sees or stores it. If you
  forget it, you will need to answer the questions again.
- Anyone who has both the file and the passphrase can open it. Keep them apart, and keep both safe.

Exporting a review bundle to share with a helper works the same way, and it asks you to confirm
first.

## No analytics

OpenBridge does not count visitors, record clicks, or use tracking tools of any kind. It has no
error reporting that sends anything away. The pages never put your answers in the web address.

If an organization hosts OpenBridge, its web server can see that someone loaded the page, the same
as any website. It cannot see your answers. Hosts are asked to keep server logs off or small (see
[[Host it for others|Host-OpenBridge]]).

## On a shared or public computer

1. Press **Clear my data / Start over** when you finish.
2. Close the browser tab.
3. If you saved a file, take it with you (for example on your phone or a USB drive) and delete it
   from the shared computer's Downloads folder.

## Different ways to use OpenBridge

| Way you use it                  | Where your answers go                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| On a website                    | Nowhere. They stay in your browser. The site only sends you the app and rules. |
| The local file on your computer | Nowhere. It works with no internet at all.                                     |
| Through an AI assistant         | Through the AI app and its company. See below.                                 |

The AI assistant option is different. When you tell an AI assistant about your household, the AI app
sends your words to its own company to process. The OpenBridge part (called the MCP server) keeps
nothing and logs nothing, but the AI company's own privacy rules apply to what you typed. See
[[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]] before you choose this.

## Related pages

- [[Using OpenBridge|Using-OpenBridge]]
- [[Guide for navigators|Navigator-Guide]]
- [[Use it with an AI assistant|Use-OpenBridge-with-an-AI-Assistant]]
- [[FAQ]]
