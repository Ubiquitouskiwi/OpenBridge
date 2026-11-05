import { useState } from 'react';
import { useIntakeStore } from '../../store/intake.js';
import { encryptToEnvelope } from '../../lib/crypto.js';
import { buildSavePayload, currentDataVersion, downloadTextFile } from './savePayload.js';

/** Save encrypted progress the user can re-import later (requirement 5.4.2/5.5.3, Q20/Q31). */
export function SaveProgress() {
  const draft = useIntakeStore((s) => s.draft);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    if (passphrase.length < 6) return;
    setBusy(true);
    try {
      const env = await encryptToEnvelope(
        buildSavePayload(draft),
        passphrase,
        currentDataVersion(),
      );
      downloadTextFile('openbridge-progress.json', JSON.stringify(env, null, 2));
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="save-progress">
      <summary>Save my progress to a file</summary>
      <p className="field-hint">
        We'll lock the file with a passphrase you choose. Keep it safe — there is no way to recover
        it if you forget it, and nothing is sent anywhere.
      </p>
      <label>
        Passphrase (at least 6 characters)
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <button type="button" onClick={() => void save()} disabled={busy || passphrase.length < 6}>
        {busy ? 'Saving…' : 'Download saved file'}
      </button>
      {done && <p role="status">Saved. Keep the file and your passphrase together safe.</p>}
    </details>
  );
}
