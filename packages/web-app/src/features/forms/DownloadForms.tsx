import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DocumentModel } from '@openbridge/form-assembly';
import { useResultStore } from '../../store/result.js';
import { useIntakeStore } from '../../store/intake.js';
import { buildSummaryModel, buildOhioModel, buildGuideModel } from './buildModels.js';
import { encryptToEnvelope } from '../../lib/crypto.js';
import { buildSavePayload, currentDataVersion, downloadTextFile } from '../save/savePayload.js';

type PdfStatus = 'idle' | 'loading' | 'done' | 'error';

function downloadBlob(blob: Blob, filename: string) {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Form downloads + the review bundle export with an explicit consent step (5.12.4, Q10/Q43). */
export function DownloadForms() {
  const { t, i18n } = useTranslation();
  const result = useResultStore((s) => s.result);
  const draft = useIntakeStore((s) => s.draft);
  const [consent, setConsent] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle');

  if (!result) return null;
  const busy = pdfStatus === 'loading';
  const isOhio = draft.stateCode.toUpperCase() === 'OH';
  const nonEnglish = i18n.language !== 'en';

  // Lazy-load the PDF renderer (and its heavy @react-pdf dependency) only on demand,
  // keeping it out of the initial bundle (tech.md bundle budget). Errors show a friendly,
  // localized message and are never logged, since a model holds personal data.
  async function renderAndDownload(model: DocumentModel, filename: string) {
    // Buttons stay enabled (disabling would drop keyboard focus); ignore repeat presses.
    if (busy) return;
    setPdfStatus('loading');
    try {
      const { documentModelToBlob } = await import('@openbridge/form-assembly');
      downloadBlob(await documentModelToBlob(model), filename);
      setPdfStatus('done');
    } catch {
      setPdfStatus('error');
    }
  }

  async function downloadSummary() {
    await renderAndDownload(buildSummaryModel(draft, result!, i18n), 'openbridge-summary.pdf');
  }

  async function downloadOhio() {
    await renderAndDownload(buildOhioModel(draft, 'snap', i18n), 'ohio-benefits-application.pdf');
  }

  async function downloadGuide() {
    await renderAndDownload(buildGuideModel('snap', i18n), 'how-to-apply.pdf');
  }

  async function exportEncryptedBundle() {
    const env = await encryptToEnvelope(buildSavePayload(draft), passphrase, currentDataVersion());
    downloadTextFile('openbridge-review-bundle.json', JSON.stringify(env, null, 2));
  }

  return (
    <section className="download-forms" aria-busy={busy}>
      <h2>Your documents</h2>
      <button type="button" onClick={() => void downloadSummary()}>
        Download summary sheet (PDF)
      </button>{' '}
      {isOhio && (
        <button type="button" onClick={() => void downloadOhio()}>
          Download Ohio application (PDF)
        </button>
      )}{' '}
      {nonEnglish && (
        <button type="button" onClick={() => void downloadGuide()}>
          Download how-to-apply guide (PDF)
        </button>
      )}
      <p role="status">
        {pdfStatus === 'loading' && t('forms.loading')}
        {pdfStatus === 'done' && t('forms.ready')}
      </p>
      {pdfStatus === 'error' && <p role="alert">{t('forms.error')}</p>}
      <h2>Share for review</h2>
      <p className="field-hint">
        A review bundle contains your answers and results so someone (like a legal aid worker) can
        help. It is created on your device and only shared if you choose to.
      </p>
      <label>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I
        understand this bundle includes my personal information and I want to export it.
      </label>
      {consent && (
        <div>
          <button type="button" onClick={() => void downloadSummary()}>
            Export plain PDF
          </button>
          <label>
            Or lock it with a passphrase
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <button
            type="button"
            disabled={passphrase.length < 6}
            onClick={() => void exportEncryptedBundle()}
          >
            Export encrypted bundle
          </button>
        </div>
      )}
    </section>
  );
}
