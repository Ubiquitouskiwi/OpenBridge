# Guide for navigators

This page is for caseworkers, volunteers, and other staff who screen several people in a row with
OpenBridge. It covers navigator mode, keeping clients apart, documents, referrals, and your privacy
duties.

> **OpenBridge is a prototype.** All three states (Ohio, Texas, Washington) use draft rules that
> experts have not checked. Treat every result as an estimate to discuss with your client, never as
> a decision. OpenBridge does not file applications or give legal advice.

## Before you start

- Know where your organization runs OpenBridge: a web address it hosts, or the local file on a work
  computer. See [[Host it for others|Host-OpenBridge]] and
  [[Run it on your computer|Run-OpenBridge-on-Your-Computer]].
- Read [[Understanding your results|Understanding-Your-Results]] so you can explain the five
  answers in plain words.

## Turn on navigator mode

1. On the start screen, choose **I'm helping others (navigator)**.
2. A **Dashboard** link appears at the top of every page.

Your organization can make navigator mode the default (see "Settings your organization controls"
below).

Navigator mode changes two things:

- **Each finished screening is kept on the Dashboard** for this session, so you can go back to it.
- **The idle auto-clear is off.** In individual mode OpenBridge wipes itself after a few minutes
  with no activity. In navigator mode it does not, so clearing is up to you.

## Screen several clients

1. Open **Dashboard** and press **Screen a new client**. This starts a blank set of questions.
2. Go through the steps with your client and press **See my results**. The result is added to the
   Dashboard as "Client 1", "Client 2", and so on.
3. Back on the **Navigator dashboard**, each client shows "Likely programs" or "No likely matches".
   Press **View results** to open that client's results again.
4. For the next person, press **Screen a new client** again.

OpenBridge does not ask for names, so the Dashboard labels are only numbers. Keep track of which
number is which person on paper you keep private, or not at all.

![The navigator dashboard with two made-up clients, each with View results and Clear client buttons]({{repo}}/raw/HEAD/docs/screenshots/navigator-dashboard.png)

## Clear between clients

The Dashboard lives only in the browser's memory. Nothing is written to the computer, but it stays
on screen until you clear it.

- **Clear client** removes one client from the Dashboard.
- **Clear all clients** removes every client.
- **Clear my data / Start over** (top of every page) erases the current answers, results, and the
  whole Dashboard.

OpenBridge has no screen lock of its own. If you step away from your desk, lock the computer
(on Windows press the Windows key and L; on a Mac press Control, Command, and Q), or press **Clear
my data / Start over** first. Closing the browser tab also erases everything.

## Documents to print or share

On a client's results page, under **Your documents**:

- **Download summary sheet (PDF)**: the results in plain words. Good to print and hand over.
- **Download Ohio application (PDF)**: for Ohio only. Today it is a list of the client's answers
  laid out as application fields, not the official form. Check it against the official form at
  benefits.ohio.gov before your client submits.
- **Download how-to-apply guide (PDF)**: shown when the language is set to Spanish. Official forms
  stay in English, and this guide explains each step.

Under **Share for review**, a client can choose to export their answers for someone else, like a
legal aid worker. They must check a box that says they understand it includes personal information.
They can then press **Export plain PDF**, or type a passphrase and press **Export encrypted
bundle**. Only do this with your client's clear permission.

![The Your documents and Share for review sections of the results page]({{repo}}/raw/HEAD/docs/screenshots/results-documents.png)

To let a client finish later, use **Save my progress to a file** with a passphrase the client
chooses and keeps. The file is the client's to keep, not yours. See
[[Privacy and your data|Privacy-and-Your-Data]].

## Referrals

Press **Get help** to see organizations that can help with applications. It shows 211 plus legal
aid groups for the client's state. The list is small today (five entries in total) and growing.
Calls and emails open on the device; OpenBridge does not contact anyone. Being listed is not an
endorsement.

## Settings your organization controls

Whoever hosts OpenBridge can set defaults in a file called `deployment-config.json`:

| Setting                   | What it does                                               | Default      |
| ------------------------- | ---------------------------------------------------------- | ------------ |
| `defaultMode`             | `individual` or `navigator` when the app opens             | `individual` |
| `autoClearTimeoutSeconds` | Seconds of no activity before clearing, in individual mode | `180`        |

The local file version cannot read this file, so it always uses the defaults. Details are in
[[Host it for others|Host-OpenBridge]].

## Your privacy duties on shared computers

- Clear the Dashboard at the end of every shift, and between clients when you can.
- Do not save client files to a shared computer. If a client saves progress, let them keep the file
  on their own phone or drive.
- Never write a client's passphrase down for them in a shared place.
- Do not add notes with names to OpenBridge or to file names.
- Explain to clients that results are estimates and that they can apply anyway.

## Related pages

- [[Understanding your results|Understanding-Your-Results]]
- [[Privacy and your data|Privacy-and-Your-Data]]
- [[Host it for others|Host-OpenBridge]]
- [[Review rules as an expert|Review-Rules-as-an-Expert]]
