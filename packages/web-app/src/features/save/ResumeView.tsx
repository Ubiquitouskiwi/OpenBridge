import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { SaveEnvelope } from '../../lib/crypto.js';
import { decryptFromEnvelope, DecryptError } from '../../lib/crypto.js';
import { useIntakeStore } from '../../store/intake.js';
import { currentDataVersion, type SavePayload } from './savePayload.js';

export function ResumeView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function unlock() {
    setError(null);
    setNotice(null);
    if (!file) {
      setError(t('resume.chooseFile'));
      return;
    }
    try {
      const envelope = JSON.parse(await file.text()) as SaveEnvelope;
      const payload = await decryptFromEnvelope<SavePayload>(envelope, passphrase);
      useIntakeStore.setState({ draft: payload.profile });
      if (payload.dataVersion !== currentDataVersion()) {
        setNotice(t('resume.staleNotice'));
      }
      navigate('/screen');
    } catch (err) {
      setError(
        err instanceof DecryptError
          ? t(`resume.errors.${err.code}`)
          : t('resume.errors.unreadable'),
      );
    }
  }

  return (
    <section>
      <h1>{t('resume.title')}</h1>
      <label>
        {t('resume.fileLabel')}
        <input
          type="file"
          accept="application/json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <label>
        {t('resume.passphraseLabel')}
        <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
      </label>
      {error && (
        <p role="alert" style={{ color: 'var(--bad)' }}>
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <button type="button" className="primary" onClick={() => void unlock()}>
        {t('resume.unlock')}
      </button>
    </section>
  );
}
