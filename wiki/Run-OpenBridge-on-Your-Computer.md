# Run it on your computer

This page shows you how to use OpenBridge as a single file on your own computer, with nothing to
install and no internet needed. It is for anyone, including people who are not comfortable with
computers.

> **OpenBridge is a prototype.** The rules are drafts that experts have not checked yet. Results
> are estimates, not decisions.

## Before you start

- A computer with a web browser: Chrome, Edge, Firefox, or Safari.
- Internet only for the download. After that, OpenBridge works offline.

## Steps

1. **Go to the Releases page.** Open the OpenBridge repository on GitHub and choose **Releases** on
   the right side. If there are no releases yet, the first one has not been published. Check back
   later, or ask the person who sent you here for a copy.
2. **Download the local file.** Under the newest release, open **Assets** and download the file
   named `openbridge-local-v` followed by a version number and `.zip` (for example
   `openbridge-local-v0.2.0.zip`).
3. **Unzip it.** On Windows, right-click the file and choose **Extract All**. On a Mac,
   double-click it.
4. **Open it.** In the new folder, double-click `OpenBridge.html`. It opens in your web browser.
5. **Use it.** Follow [[Using OpenBridge|Using-OpenBridge]].

## Optional: check the download is genuine

Each release also has a file called `SHA256SUMS.txt`. It lists a "fingerprint" (checksum) for every
download. If your fingerprint matches, the file was not changed or damaged on the way. You can skip
this, but it is a good habit.

Open a terminal in the folder with the zip file and run the command for your computer:

| Computer | Command                                                 |
| -------- | ------------------------------------------------------- |
| Windows  | `certutil -hashfile openbridge-local-v0.2.0.zip SHA256` |
| Mac      | `shasum -a 256 openbridge-local-v0.2.0.zip`             |
| Linux    | `sha256sum openbridge-local-v0.2.0.zip`                 |

Use your real file name. Compare the long string it prints with the line for that file in
`SHA256SUMS.txt`. They should be the same.

## If something goes wrong

- **It opens in the wrong program** (like a text editor). Right-click `OpenBridge.html`, choose
  **Open with**, and pick your web browser.
- **It shows the zip contents instead of the app.** Unzip first, then open the file from the new
  folder, not from inside the zip.
- **A blank page or a warning** on a work or school computer. Some managed browsers block pages
  opened from a file. Try a different browser, or ask your IT team.
- **Saving does nothing.** Your browser puts the saved file (`openbridge-progress.json`) in your
  Downloads folder. Check there. Some browsers ask where to save it first.

If you are still stuck, email openbridge@starlingtek.com, or open a "Bug report" issue on the
OpenBridge GitHub page.

## What is different from the website

- **No automatic updates.** The file never changes by itself. Rules change every year, so an old
  copy can give out-of-date results.
- **Organization settings do not apply.** The local file always starts in the normal mode and
  clears itself after 3 minutes of no activity.
- **The same privacy.** It makes no internet requests at all. Closing the tab erases your answers.

## How to update

1. Download the newest `openbridge-local-v...zip` from Releases, as above.
2. Unzip it and use the new `OpenBridge.html`. You can delete the old folder.
3. To see which version you have, open `BUILD-INFO.json` in the folder. It lists the version and
   the rules data version.

Saved files from an older copy still open in the new one. Your answers fill back in, and pressing
**See my results** checks them against the newer rules.

## Related pages

- [[Using OpenBridge|Using-OpenBridge]]
- [[Privacy and your data|Privacy-and-Your-Data]]
- [[Host it for others|Host-OpenBridge]]
- [[FAQ]]
