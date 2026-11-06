/**
 * The only ways data leaves the toolkit: a file the user downloads, or text they copy.
 * Both happen on the device. Nothing is sent anywhere.
 */

/** Trigger a browser download of a text file made in memory. */
export function downloadTextFile(filename: string, contents: string, type: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click has been handled so the download is not cut off.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Copy text to the clipboard. Resolves false when the browser does not allow it. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the older copy method below.
  }
  if (typeof document === 'undefined') return false;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}
